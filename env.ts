import 'dotenv/config';

import assert from 'node:assert/strict';

const sdkRoot = 'ANDROID_SDK_ROOT';
const ndkVersion = 'FFMPEG_ANDROID_NDK_VERSION';
const sdkPlatform = 'FFMPEG_ANDROID_SDK_PLATFORM';

assert(process.env[sdkRoot]);
assert(process.env[ndkVersion]);
assert(process.env[sdkPlatform]);

export const env = {
	sdkRoot: process.env[sdkRoot],
	ndkVersion: process.env[ndkVersion],
	sdkPlatform: process.env[sdkPlatform],
} as const;
