#include "csi_processor.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"

#include "http_client.h"

#define TAG "CSI_PROC"

typedef struct {
    uint16_t length;
    uint16_t seq;
    int8_t rssi;
    int8_t noise_floor;
    uint8_t mac[6];
    uint8_t channel;
    int8_t secondary_channel;
    int8_t payload[];
} csi_packet_t;

static QueueHandle_t csi_queue;

static void format_mac(const uint8_t mac[6], char out[18]) {
    snprintf(out, 18, "%02x:%02x:%02x:%02x:%02x:%02x",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}

static void iso_timestamp(char *buffer, size_t size) {
    time_t now = time(NULL);
    struct tm timeinfo = {0};
    gmtime_r(&now, &timeinfo);
    strftime(buffer, size, "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
}

static char *build_json_payload(const csi_packet_t *packet, size_t *out_length) {
    if (!packet) {
        return NULL;
    }

    const size_t pair_count = packet->length / 2;
    const size_t estimate = (pair_count * 24) + 512;
    char *buffer = (char *)malloc(estimate);
    if (!buffer) {
        ESP_LOGE(TAG, "Failed to allocate JSON buffer");
        return NULL;
    }

    char mac_str[18];
    format_mac(packet->mac, mac_str);

    char timestamp[32];
    iso_timestamp(timestamp, sizeof(timestamp));

    size_t offset = 0;
    offset += snprintf(buffer + offset, estimate - offset,
                        "{\"mac_address\":\"%s\","
                        "\"source_mac\":\"%s\","
                        "\"sequence_id\":%u,"
                        "\"timestamp\":\"%s\","
                        "\"rssi\":%d,"
                        "\"noise_floor\":%d,"
                        "\"csi\":[",
                        CONFIG_SENSEBEYOND_DEVICE_LABEL,
                        mac_str,
                        packet->seq,
                        timestamp,
                        packet->rssi,
                        packet->noise_floor);

    offset += snprintf(buffer + offset, estimate - offset, "[");

    for (size_t i = 0; i < pair_count; ++i) {
        int8_t real = packet->payload[2 * i];
        int8_t imag = packet->payload[(2 * i) + 1];
        offset += snprintf(buffer + offset, estimate - offset, "[%d,%d]%s",
                            real,
                            imag,
                            (i + 1 < pair_count) ? "," : "]");
        if (offset >= estimate - 4) {
            break;
        }
    }

    offset += snprintf(buffer + offset, estimate - offset, "]}");

    if (out_length) {
        *out_length = offset;
    }

    return buffer;
}

static void csi_http_task(void *arg) {
    while (true) {
        csi_packet_t *packet = NULL;
        if (xQueueReceive(csi_queue, &packet, portMAX_DELAY) != pdTRUE) {
            continue;
        }

        size_t body_len = 0;
        char *body = build_json_payload(packet, &body_len);
        if (body) {
            int status = 0;
            esp_err_t err = sense_http_client_post("/csi", body, body_len, &status);
            if (err != ESP_OK || status >= 300) {
                ESP_LOGE(TAG, "POST /csi failed err=%s status=%d", esp_err_to_name(err), status);
                vTaskDelay(pdMS_TO_TICKS(CONFIG_SENSEBEYOND_HTTP_RETRY_MS));
            }
            free(body);
        }

        free(packet);
    }
}

esp_err_t csi_processor_init(void) {
    if (csi_queue) {
        return ESP_OK;
    }

    csi_queue = xQueueCreate(CONFIG_SENSEBEYOND_MAX_QUEUE_DEPTH, sizeof(csi_packet_t *));
    if (!csi_queue) {
        ESP_LOGE(TAG, "Unable to allocate CSI queue");
        return ESP_ERR_NO_MEM;
    }

    BaseType_t ok = xTaskCreatePinnedToCore(csi_http_task, "csi_http", 8192, NULL, 6, NULL, tskNO_AFFINITY);
    if (ok != pdPASS) {
        ESP_LOGE(TAG, "Failed to create CSI HTTP task");
        vQueueDelete(csi_queue);
        csi_queue = NULL;
        return ESP_FAIL;
    }
    return ESP_OK;
}

esp_err_t csi_processor_submit(const wifi_csi_info_t *info) {
    if (!info || !csi_queue) {
        return ESP_ERR_INVALID_STATE;
    }

    const size_t size = sizeof(csi_packet_t) + info->len;
    csi_packet_t *packet = (csi_packet_t *)malloc(size);
    if (!packet) {
        ESP_LOGE(TAG, "CSI packet allocation failed");
        return ESP_ERR_NO_MEM;
    }

    packet->length = info->len;
    packet->seq = info->rx_seq;
    packet->rssi = info->rx_ctrl.rssi;
    packet->noise_floor = info->rx_ctrl.noise_floor;
    packet->channel = info->rx_ctrl.channel;
    packet->secondary_channel = info->rx_ctrl.secondary_channel;
    memcpy(packet->mac, info->mac, sizeof(packet->mac));
    memcpy(packet->payload, info->buf, info->len);

    BaseType_t higher_woken = pdFALSE;
    if (xQueueSendFromISR(csi_queue, &packet, &higher_woken) != pdTRUE) {
        free(packet);
        return ESP_ERR_NO_MEM;
    }

    if (higher_woken) {
        portYIELD_FROM_ISR();
    }

    return ESP_OK;
}
