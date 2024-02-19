import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import { execa } from 'execa';

import { env } from './env.js';

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, 'dist');

process.chdir('node_modules/ffmpeg');

const ndkRoot = path.join(env.sdkRoot, 'ndk', env.ndkVersion);
const hostArchitecture = 'linux-x86_64';
const toolchain = path.join(ndkRoot, 'toolchains/llvm/prebuilt', hostArchitecture);
const toolchainBin = path.join(toolchain, 'bin');

const targets = [
	{
		abi: 'armeabi-v7a',
		prefix: 'armv7a-linux-androideabi',
		arch: 'armv7a',
		flags: [],
	},
	{
		abi: 'arm64-v8a',
		prefix: 'aarch64-linux-android',
		arch: 'aarch64',
		flags: [],
	},
	{
		abi: 'x86',
		prefix: 'i686-linux-android',
		arch: 'x86',
		flags: ['--disable-asm'],
	},
	{
		abi: 'x86_64',
		prefix: 'x86_64-linux-android',
		arch: 'x86_64',
		flags: [`--x86asmexe=${toolchainBin}/yasm`],
	},
] as const;

try {
	await fs.rm(outDir, { recursive: true, force: true });
} catch {}

await fs.mkdir(outDir);

for (const target of targets) {
	const destination = path.join(outDir, target.abi);

	console.log(`Configure and build target '${target.abi}'`);

	const clang = `${toolchainBin}/${target.prefix}${env.sdkPlatform}-clang`;

	type Command = readonly [string, ...string[]];

	const configure: Command = [
		'./configure',
		`--prefix=${destination}`,
		'--enable-cross-compile',
		'--target-os=android',
		`--arch=${target.arch}`,
		`--sysroot=${toolchain}/sysroot`,
		`--cc=${clang}`,
		`--ld=${clang}`,
		`--ar=${toolchainBin}/llvm-ar`,
		`--nm=${toolchainBin}/llvm-nm`,
		`--ranlib=${toolchainBin}/llvm-ranlib`,
		`--strip=${toolchainBin}/llvm-strip`,
		'--extra-cflags="-O3"',
		'--disable-programs',
		'--disable-doc',
		'--disable-avdevice',
		'--disable-avfilter',
		'--disable-swscale',
		'--enable-shared',
		'--disable-static',
		'--disable-everything',
		'--enable-decoder=mp3',
		'--enable-demuxer=mp3',
		...target.flags,
	];

	const commands: Command[] = [configure, ['make', 'clean'], ['make', `-j${os.availableParallelism()}`], ['make', 'install']];

	for (const command of commands) {
		const [file, ...args] = command;
		await execa(file, args, { stdio: 'inherit' });
	}

	console.log(`Remove examples`);

	await fs.rm(path.join(destination, 'share'), { recursive: true, force: true });

	console.log(`Done building '${target.abi}'\n`);
}
