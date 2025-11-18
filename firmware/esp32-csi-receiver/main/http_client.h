#pragma once

#include <stddef.h>
#include "esp_err.h"

esp_err_t sense_http_client_post(const char *path, const char *payload, size_t length, int *status_code);
