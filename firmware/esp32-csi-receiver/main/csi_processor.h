#pragma once

#include "esp_err.h"
#include "esp_wifi_types.h"

esp_err_t csi_processor_init(void);
esp_err_t csi_processor_submit(const wifi_csi_info_t *info);
