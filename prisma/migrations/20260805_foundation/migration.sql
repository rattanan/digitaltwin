-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `username` VARCHAR(120) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `failed_login_count` INTEGER NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `last_login_at` DATETIME(3) NULL,
    `agency_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_public_id_key`(`public_id`),
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_agency_id_idx`(`agency_id`),
    INDEX `users_is_active_deleted_at_idx`(`is_active`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `description` VARCHAR(500) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `roles_public_id_key`(`public_id`),
    UNIQUE INDEX `roles_code_key`(`code`),
    INDEX `roles_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(120) NOT NULL,
    `module` VARCHAR(80) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_module_action_idx`(`module`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` CHAR(36) NOT NULL,
    `role_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_roles_role_id_idx`(`role_id`),
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` CHAR(36) NOT NULL,
    `permission_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `role_permissions_permission_id_idx`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_data_scopes` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `scope_type` VARCHAR(40) NOT NULL,
    `scope_value` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_data_scopes_user_id_scope_type_scope_value_idx`(`user_id`, `scope_type`, `scope_value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `session_token` VARCHAR(255) NOT NULL,
    `ip_address` VARCHAR(64) NULL,
    `user_agent` VARCHAR(500) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_session_token_key`(`session_token`),
    INDEX `sessions_user_id_revoked_at_expires_at_idx`(`user_id`, `revoked_at`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL,
    `session_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,
    `replaced_by_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_revoked_at_expires_at_idx`(`user_id`, `revoked_at`, `expires_at`),
    INDEX `refresh_tokens_session_id_idx`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agencies` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `description` VARCHAR(500) NULL,
    `contact_name` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(80) NULL,
    `contact_email` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `agencies_public_id_key`(`public_id`),
    UNIQUE INDEX `agencies_code_key`(`code`),
    INDEX `agencies_is_active_deleted_at_idx`(`is_active`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provinces` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `area_sq_km` DECIMAL(12, 2) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `population` INTEGER NULL,
    `households` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `provinces_public_id_key`(`public_id`),
    UNIQUE INDEX `provinces_code_key`(`code`),
    INDEX `provinces_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `districts` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `province_id` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `area_sq_km` DECIMAL(12, 2) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `population` INTEGER NULL,
    `households` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `districts_public_id_key`(`public_id`),
    INDEX `districts_province_id_deleted_at_idx`(`province_id`, `deleted_at`),
    UNIQUE INDEX `districts_province_id_code_key`(`province_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subdistricts` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `district_id` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `area_sq_km` DECIMAL(12, 2) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `population` INTEGER NULL,
    `households` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `subdistricts_public_id_key`(`public_id`),
    INDEX `subdistricts_district_id_deleted_at_idx`(`district_id`, `deleted_at`),
    UNIQUE INDEX `subdistricts_district_id_code_key`(`district_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `villages` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `subdistrict_id` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `area_sq_km` DECIMAL(12, 2) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `population` INTEGER NULL,
    `households` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `villages_public_id_key`(`public_id`),
    INDEX `villages_subdistrict_id_deleted_at_idx`(`subdistrict_id`, `deleted_at`),
    UNIQUE INDEX `villages_subdistrict_id_code_key`(`subdistrict_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` CHAR(36) NOT NULL,
    `setting_key` VARCHAR(191) NOT NULL,
    `value_json` JSON NOT NULL,
    `category` VARCHAR(80) NOT NULL DEFAULT 'system',
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by_id` CHAR(36) NULL,

    UNIQUE INDEX `system_settings_setting_key_key`(`setting_key`),
    INDEX `system_settings_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `actor_id` CHAR(36) NULL,
    `action` VARCHAR(80) NOT NULL,
    `module` VARCHAR(80) NOT NULL,
    `entity_type` VARCHAR(100) NULL,
    `entity_id` VARCHAR(120) NULL,
    `request_id` VARCHAR(120) NULL,
    `ip_address` VARCHAR(64) NULL,
    `user_agent` VARCHAR(500) NULL,
    `before_data` JSON NULL,
    `after_data` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actor_id_created_at_idx`(`actor_id`, `created_at`),
    INDEX `audit_logs_module_entity_type_entity_id_idx`(`module`, `entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locations` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `category` VARCHAR(80) NOT NULL,
    `address` VARCHAR(500) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `agency_id` CHAR(36) NULL,
    `province_id` CHAR(36) NULL,
    `district_id` CHAR(36) NULL,
    `subdistrict_id` CHAR(36) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `locations_public_id_key`(`public_id`),
    INDEX `locations_category_deleted_at_idx`(`category`, `deleted_at`),
    INDEX `locations_province_id_district_id_subdistrict_id_idx`(`province_id`, `district_id`, `subdistrict_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cctv_cameras` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `camera_code` VARCHAR(80) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `status` VARCHAR(40) NOT NULL,
    `nfs_folder_path` VARCHAR(500) NULL,
    `last_image_at` DATETIME(3) NULL,
    `last_heartbeat` DATETIME(3) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `agency_id` CHAR(36) NULL,
    `location_id` CHAR(36) NULL,
    `province_id` CHAR(36) NULL,
    `district_id` CHAR(36) NULL,
    `subdistrict_id` CHAR(36) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `cctv_cameras_public_id_key`(`public_id`),
    UNIQUE INDEX `cctv_cameras_camera_code_key`(`camera_code`),
    INDEX `cctv_cameras_status_deleted_at_idx`(`status`, `deleted_at`),
    INDEX `cctv_cameras_district_id_status_idx`(`district_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cctv_snapshots` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `camera_id` CHAR(36) NOT NULL,
    `image_path` VARCHAR(500) NOT NULL,
    `captured_at` DATETIME(3) NOT NULL,
    `file_modified_at` DATETIME(3) NULL,
    `file_size_bytes` BIGINT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cctv_snapshots_camera_id_captured_at_idx`(`camera_id`, `captured_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cctv_ai_results` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `camera_id` CHAR(36) NOT NULL,
    `snapshot_id` BIGINT NULL,
    `event_type` VARCHAR(80) NOT NULL,
    `confidence` DECIMAL(5, 4) NOT NULL,
    `detected_at` DATETIME(3) NOT NULL,
    `verification` VARCHAR(40) NOT NULL DEFAULT 'UNVERIFIED',
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cctv_ai_results_camera_id_detected_at_idx`(`camera_id`, `detected_at`),
    INDEX `cctv_ai_results_event_type_confidence_idx`(`event_type`, `confidence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iot_device_types` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `description` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `iot_device_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iot_devices` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `device_code` VARCHAR(80) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `status` VARCHAR(40) NOT NULL,
    `unit` VARCHAR(40) NULL,
    `battery` DECIMAL(5, 2) NULL,
    `last_heartbeat` DATETIME(3) NULL,
    `type_id` CHAR(36) NOT NULL,
    `agency_id` CHAR(36) NULL,
    `location_id` CHAR(36) NULL,
    `province_id` CHAR(36) NULL,
    `district_id` CHAR(36) NULL,
    `subdistrict_id` CHAR(36) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `iot_devices_public_id_key`(`public_id`),
    UNIQUE INDEX `iot_devices_device_code_key`(`device_code`),
    INDEX `iot_devices_type_id_status_idx`(`type_id`, `status`),
    INDEX `iot_devices_district_id_status_idx`(`district_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iot_metrics` (
    `id` CHAR(36) NOT NULL,
    `device_id` CHAR(36) NOT NULL,
    `type_id` CHAR(36) NOT NULL,
    `metric_key` VARCHAR(80) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(40) NULL,
    `warning` DECIMAL(20, 6) NULL,
    `critical` DECIMAL(20, 6) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `iot_metrics_device_id_metric_key_key`(`device_id`, `metric_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iot_readings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `device_id` CHAR(36) NOT NULL,
    `metric_id` CHAR(36) NULL,
    `metric_key` VARCHAR(80) NOT NULL,
    `value` DECIMAL(20, 6) NOT NULL,
    `unit` VARCHAR(40) NULL,
    `recorded_at` DATETIME(3) NOT NULL,
    `idempotency_key` VARCHAR(191) NULL,
    `metadata` JSON NULL,

    UNIQUE INDEX `iot_readings_idempotency_key_key`(`idempotency_key`),
    INDEX `iot_readings_device_id_recorded_at_metric_key_idx`(`device_id`, `recorded_at`, `metric_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iot_latest_values` (
    `id` CHAR(36) NOT NULL,
    `device_id` CHAR(36) NOT NULL,
    `metric_key` VARCHAR(80) NOT NULL,
    `value` DECIMAL(20, 6) NOT NULL,
    `unit` VARCHAR(40) NULL,
    `recorded_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `iot_latest_values_metric_key_recorded_at_idx`(`metric_key`, `recorded_at`),
    UNIQUE INDEX `iot_latest_values_device_id_metric_key_key`(`device_id`, `metric_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alerts` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(1000) NULL,
    `source` VARCHAR(80) NOT NULL,
    `severity` VARCHAR(40) NOT NULL,
    `status` VARCHAR(40) NOT NULL,
    `agency_id` CHAR(36) NULL,
    `province_id` CHAR(36) NULL,
    `district_id` CHAR(36) NULL,
    `subdistrict_id` CHAR(36) NULL,
    `location_id` CHAR(36) NULL,
    `camera_id` CHAR(36) NULL,
    `device_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `acknowledged_at` DATETIME(3) NULL,
    `resolved_at` DATETIME(3) NULL,
    `metadata` JSON NULL,

    UNIQUE INDEX `alerts_public_id_key`(`public_id`),
    INDEX `alerts_severity_status_created_at_idx`(`severity`, `status`, `created_at`),
    INDEX `alerts_district_id_created_at_idx`(`district_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alert_histories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `alert_id` CHAR(36) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `note` VARCHAR(1000) NULL,
    `actor_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `alert_histories_alert_id_created_at_idx`(`alert_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incidents` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `incident_no` VARCHAR(80) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(1200) NULL,
    `category` VARCHAR(80) NOT NULL,
    `severity` VARCHAR(40) NOT NULL,
    `status` VARCHAR(40) NOT NULL,
    `due_at` DATETIME(3) NULL,
    `agency_id` CHAR(36) NULL,
    `province_id` CHAR(36) NULL,
    `district_id` CHAR(36) NULL,
    `location_id` CHAR(36) NULL,
    `alert_id` CHAR(36) NULL,
    `camera_id` CHAR(36) NULL,
    `device_id` CHAR(36) NULL,
    `assigned_user_id` CHAR(36) NULL,
    `resolution` VARCHAR(1200) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `closed_at` DATETIME(3) NULL,
    `subdistrict_id` CHAR(36) NULL,

    UNIQUE INDEX `incidents_public_id_key`(`public_id`),
    UNIQUE INDEX `incidents_incident_no_key`(`incident_no`),
    INDEX `incidents_status_severity_created_at_idx`(`status`, `severity`, `created_at`),
    INDEX `incidents_agency_id_status_idx`(`agency_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incident_histories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `incident_id` CHAR(36) NOT NULL,
    `status` VARCHAR(40) NOT NULL,
    `note` VARCHAR(1000) NULL,
    `actor_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `incident_histories_incident_id_created_at_idx`(`incident_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statistic_categories` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,

    UNIQUE INDEX `statistic_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statistic_definitions` (
    `id` CHAR(36) NOT NULL,
    `category_id` CHAR(36) NOT NULL,
    `metric_key` VARCHAR(120) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `unit` VARCHAR(40) NULL,

    UNIQUE INDEX `statistic_definitions_metric_key_key`(`metric_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statistic_values` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `definition_id` CHAR(36) NOT NULL,
    `province_id` CHAR(36) NULL,
    `district_id` CHAR(36) NULL,
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `numeric_value` DECIMAL(20, 6) NULL,
    `value_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `statistic_values_definition_id_period_start_period_end_idx`(`definition_id`, `period_start`, `period_end`),
    INDEX `statistic_values_district_id_period_start_idx`(`district_id`, `period_start`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(1000) NULL,
    `body` TEXT NULL,
    `type` VARCHAR(80) NOT NULL,
    `status` VARCHAR(40) NOT NULL,
    `priority` VARCHAR(40) NOT NULL DEFAULT 'NORMAL',
    `is_pinned` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `news_public_id_key`(`public_id`),
    INDEX `news_status_is_pinned_published_at_idx`(`status`, `is_pinned`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_conversations` (
    `id` CHAR(36) NOT NULL,
    `public_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `context_module` VARCHAR(80) NULL,
    `last_message_at` DATETIME(3) NULL,
    `is_pinned` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `ai_conversations_public_id_key`(`public_id`),
    INDEX `ai_conversations_user_id_updated_at_idx`(`user_id`, `updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_messages` (
    `id` CHAR(36) NOT NULL,
    `conversation_id` CHAR(36) NOT NULL,
    `role` VARCHAR(40) NOT NULL,
    `content` TEXT NOT NULL,
    `structured_json` JSON NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'COMPLETED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_messages_conversation_id_created_at_idx`(`conversation_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_message_sources` (
    `id` CHAR(36) NOT NULL,
    `message_id` CHAR(36) NOT NULL,
    `source_module` VARCHAR(80) NOT NULL,
    `source_type` VARCHAR(80) NOT NULL,
    `source_name` VARCHAR(191) NOT NULL,
    `source_timestamp` DATETIME(3) NULL,
    `source_url` VARCHAR(500) NULL,
    `metadata` JSON NULL,

    INDEX `ai_message_sources_message_id_idx`(`message_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_suggested_questions` (
    `id` CHAR(36) NOT NULL,
    `module` VARCHAR(80) NOT NULL,
    `question_th` VARCHAR(500) NOT NULL,
    `question_en` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_suggested_questions_module_is_active_sort_order_idx`(`module`, `is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_data_scopes` ADD CONSTRAINT `user_data_scopes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `districts` ADD CONSTRAINT `districts_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subdistricts` ADD CONSTRAINT `subdistricts_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `villages` ADD CONSTRAINT `villages_subdistrict_id_fkey` FOREIGN KEY (`subdistrict_id`) REFERENCES `subdistricts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_subdistrict_id_fkey` FOREIGN KEY (`subdistrict_id`) REFERENCES `subdistricts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cctv_cameras` ADD CONSTRAINT `cctv_cameras_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cctv_cameras` ADD CONSTRAINT `cctv_cameras_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cctv_cameras` ADD CONSTRAINT `cctv_cameras_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cctv_cameras` ADD CONSTRAINT `cctv_cameras_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cctv_cameras` ADD CONSTRAINT `cctv_cameras_subdistrict_id_fkey` FOREIGN KEY (`subdistrict_id`) REFERENCES `subdistricts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cctv_snapshots` ADD CONSTRAINT `cctv_snapshots_camera_id_fkey` FOREIGN KEY (`camera_id`) REFERENCES `cctv_cameras`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cctv_ai_results` ADD CONSTRAINT `cctv_ai_results_camera_id_fkey` FOREIGN KEY (`camera_id`) REFERENCES `cctv_cameras`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cctv_ai_results` ADD CONSTRAINT `cctv_ai_results_snapshot_id_fkey` FOREIGN KEY (`snapshot_id`) REFERENCES `cctv_snapshots`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_devices_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `iot_device_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_devices_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_devices_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_devices_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_devices_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_devices` ADD CONSTRAINT `iot_devices_subdistrict_id_fkey` FOREIGN KEY (`subdistrict_id`) REFERENCES `subdistricts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_metrics` ADD CONSTRAINT `iot_metrics_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `iot_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_metrics` ADD CONSTRAINT `iot_metrics_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `iot_device_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_readings` ADD CONSTRAINT `iot_readings_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `iot_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_readings` ADD CONSTRAINT `iot_readings_metric_id_fkey` FOREIGN KEY (`metric_id`) REFERENCES `iot_metrics`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iot_latest_values` ADD CONSTRAINT `iot_latest_values_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `iot_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_subdistrict_id_fkey` FOREIGN KEY (`subdistrict_id`) REFERENCES `subdistricts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_camera_id_fkey` FOREIGN KEY (`camera_id`) REFERENCES `cctv_cameras`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `iot_devices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alert_histories` ADD CONSTRAINT `alert_histories_alert_id_fkey` FOREIGN KEY (`alert_id`) REFERENCES `alerts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_alert_id_fkey` FOREIGN KEY (`alert_id`) REFERENCES `alerts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_camera_id_fkey` FOREIGN KEY (`camera_id`) REFERENCES `cctv_cameras`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `iot_devices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_subdistrict_id_fkey` FOREIGN KEY (`subdistrict_id`) REFERENCES `subdistricts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incident_histories` ADD CONSTRAINT `incident_histories_incident_id_fkey` FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statistic_definitions` ADD CONSTRAINT `statistic_definitions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `statistic_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statistic_values` ADD CONSTRAINT `statistic_values_definition_id_fkey` FOREIGN KEY (`definition_id`) REFERENCES `statistic_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statistic_values` ADD CONSTRAINT `statistic_values_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statistic_values` ADD CONSTRAINT `statistic_values_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_conversations` ADD CONSTRAINT `ai_conversations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_messages` ADD CONSTRAINT `ai_messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_message_sources` ADD CONSTRAINT `ai_message_sources_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `ai_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
