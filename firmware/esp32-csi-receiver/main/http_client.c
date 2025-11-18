#include "http_client.h"

#include <stdio.h>
#include <string.h>

#include "esp_err.h"
#include "esp_http_client.h"
#include "esp_log.h"

#define TAG "CSI_HTTP"

static esp_http_client_handle_t client = NULL;

static esp_err_t http_event_handler(esp_http_client_event_t *evt) {
    switch (evt->event_id) {
        case HTTP_EVENT_ERROR:
            ESP_LOGW(TAG, "HTTP_EVENT_ERROR");
            break;
        case HTTP_EVENT_ON_DATA:
            ESP_LOGV(TAG, "HTTP_EVENT_ON_DATA len=%d", evt->data_len);
            break;
        default:
            break;
    }
    return ESP_OK;
}

esp_err_t sense_http_client_post(const char *path, const char *payload, size_t length, int *status_code) {
    if (payload == NULL || path == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    if (client == NULL) {
        esp_http_client_config_t config = {
            .url = CONFIG_SENSEBEYOND_BACKEND_URL,
            .timeout_ms = 5000,
            .event_handler = http_event_handler,
            .disable_auto_redirect = true,
        };
        client = esp_http_client_init(&config);
        if (client == NULL) {
            ESP_LOGE(TAG, "Failed to init HTTP client");
            return ESP_FAIL;
        }
    }

    char url[256];
    snprintf(url, sizeof(url), "%s%s", CONFIG_SENSEBEYOND_BACKEND_URL, path);

    ESP_ERROR_CHECK_WITHOUT_ABORT(esp_http_client_set_url(client, url));
    ESP_ERROR_CHECK_WITHOUT_ABORT(esp_http_client_set_method(client, HTTP_METHOD_POST));
    ESP_ERROR_CHECK_WITHOUT_ABORT(esp_http_client_set_header(client, "Content-Type", "application/json"));
    ESP_ERROR_CHECK_WITHOUT_ABORT(esp_http_client_set_post_field(client, payload, (int)length));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        if (status_code) {
            *status_code = esp_http_client_get_status_code(client);
        }
        ESP_LOGD(TAG, "POST %s status=%d len=%d", url, esp_http_client_get_status_code(client), esp_http_client_get_content_length(client));
    } else {
        ESP_LOGE(TAG, "HTTP request failed: %s", esp_err_to_name(err));
    }

    return err;
}
