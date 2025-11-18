#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <inttypes.h>

#include "esp_err.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/task.h"
#include "nvs_flash.h"

#define TAG "CSI_SENDER"

static uint8_t target_mac[6] = {0};
static EventGroupHandle_t sender_events;
static const int BIT_STA_CONNECTED = BIT0;

static bool parse_mac(const char *text, uint8_t mac[6]) {
    if (!text) {
        return false;
    }

    int values[6] = {0};
    if (sscanf(text, "%x:%x:%x:%x:%x:%x",
               &values[0], &values[1], &values[2],
               &values[3], &values[4], &values[5]) != 6) {
        return false;
    }

    for (int i = 0; i < 6; ++i) {
        mac[i] = (uint8_t)values[i];
    }
    return true;
}

static void wifi_event_handler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_AP_STACONNECTED) {
        wifi_event_ap_staconnected_t *event = (wifi_event_ap_staconnected_t *)event_data;
        ESP_LOGI(TAG, "Station joined: %02x:%02x:%02x:%02x:%02x:%02x AID %d",
                 event->mac[0], event->mac[1], event->mac[2],
                 event->mac[3], event->mac[4], event->mac[5], event->aid);
        xEventGroupSetBits(sender_events, BIT_STA_CONNECTED);
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_AP_STADISCONNECTED) {
        wifi_event_ap_stadisconnected_t *event = (wifi_event_ap_stadisconnected_t *)event_data;
        ESP_LOGW(TAG, "Station left: %02x:%02x:%02x:%02x:%02x:%02x AID %d",
                 event->mac[0], event->mac[1], event->mac[2],
                 event->mac[3], event->mac[4], event->mac[5], event->aid);
        if (xEventGroupGetBits(sender_events) & BIT_STA_CONNECTED) {
            xEventGroupClearBits(sender_events, BIT_STA_CONNECTED);
        }
    }
}

static void traffic_inject_task(void *arg) {
    uint8_t ap_mac[6] = {0};
    ESP_ERROR_CHECK(esp_wifi_get_mac(WIFI_IF_AP, ap_mac));

    struct __attribute__((packed)) {
        uint8_t frame_ctrl[2];
        uint8_t duration[2];
        uint8_t addr1[6];
        uint8_t addr2[6];
        uint8_t addr3[6];
        uint16_t seq_ctrl;
    } null_frame = {
        .frame_ctrl = {0x48, 0x01}, // Data frame, subtype Null, To DS set
        .duration = {0x00, 0x00},
        .seq_ctrl = 0,
    };

    memcpy(null_frame.addr1, target_mac, sizeof(null_frame.addr1));
    memcpy(null_frame.addr2, ap_mac, sizeof(null_frame.addr2));
    memcpy(null_frame.addr3, ap_mac, sizeof(null_frame.addr3));

    uint16_t sequence = 0;
    const TickType_t base_delay = pdMS_TO_TICKS(CONFIG_SENSEBEYOND_TX_INTERVAL_MS);
    const TickType_t max_delay = pdMS_TO_TICKS(CONFIG_SENSEBEYOND_TX_INTERVAL_MS * 10);
    TickType_t current_delay = base_delay;
    uint32_t throttled_errors = 0;

    while (true) {
        xEventGroupWaitBits(sender_events, BIT_STA_CONNECTED, pdFALSE, pdFALSE, portMAX_DELAY);

        null_frame.seq_ctrl = sequence << 4; // sequence number occupies bits [15:4]
        esp_err_t err = esp_wifi_80211_tx(WIFI_IF_AP, &null_frame, sizeof(null_frame), false);
        if (err != ESP_OK) {
            if (err == ESP_ERR_NO_MEM) {
                throttled_errors++;
                if ((throttled_errors % 25U) == 1U) {
                    ESP_LOGW(TAG,
                             "esp_wifi_80211_tx backoff after %" PRIu32 " OOM errors (delay=%" PRIu32 " ms)",
                             throttled_errors,
                             current_delay * portTICK_PERIOD_MS);
                }
                // Back off transmit cadence to give the Wi-Fi driver room to flush its queue.
                if (current_delay < max_delay) {
                    current_delay += base_delay;
                }
            } else {
                ESP_LOGE(TAG, "esp_wifi_80211_tx failed: %s", esp_err_to_name(err));
            }
        } else {
            throttled_errors = 0;
            current_delay = base_delay;
        }

        sequence = (sequence + 1) & 0x0FFF;
        vTaskDelay(current_delay);
    }
}

static void init_softap(void) {
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_event_handler, NULL, NULL));

    wifi_config_t wifi_config = {0};
    strlcpy((char *)wifi_config.ap.ssid, CONFIG_SENSEBEYOND_SENDER_SSID, sizeof(wifi_config.ap.ssid));
    wifi_config.ap.ssid_len = strlen(CONFIG_SENSEBEYOND_SENDER_SSID);
    wifi_config.ap.channel = CONFIG_SENSEBEYOND_SENDER_CHANNEL;
    wifi_config.ap.max_connection = 2;
    wifi_config.ap.beacon_interval = 100;

    size_t pass_len = strlen(CONFIG_SENSEBEYOND_SENDER_PASSWORD);
    if (pass_len > 0) {
        strlcpy((char *)wifi_config.ap.password, CONFIG_SENSEBEYOND_SENDER_PASSWORD, sizeof(wifi_config.ap.password));
        wifi_config.ap.authmode = WIFI_AUTH_WPA2_PSK;
    } else {
        wifi_config.ap.authmode = WIFI_AUTH_OPEN;
    }

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "SoftAP started on channel %d SSID '%s'", wifi_config.ap.channel, CONFIG_SENSEBEYOND_SENDER_SSID);
}

void app_main(void) {
    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_ap();

    if (!parse_mac(CONFIG_SENSEBEYOND_TARGET_MAC, target_mac)) {
        ESP_LOGE(TAG, "Invalid target MAC '%s'", CONFIG_SENSEBEYOND_TARGET_MAC);
        abort();
    }

    sender_events = xEventGroupCreate();
    init_softap();

    xTaskCreatePinnedToCore(traffic_inject_task, "traffic_inject", 4096, NULL, 5, NULL, tskNO_AFFINITY);
}
