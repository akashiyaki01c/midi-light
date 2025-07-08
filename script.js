async function sendMidi() {
	let startTime = 0;
	const midiOutputs = await getMIDI();
	const arrayBufferSource = await getAudioBufferSource(await getMp3ArrayBuffer("./BLACK SHOUT.mp3"));
	let settings = parseLightData(await (await fetch("./settings.tsv")).text()).sort((a, b) => a.time - b.time);
	const element = document.querySelector("#output");

	if (midiOutputs.size == 0) {
		element.innerHTML += `<div>MIDIがなかったよーん</div>`;
		return;
	}
	const midiOutput = [...midiOutputs.values()][0];

	{ // 再生処理
		// 0xB0 = ch1のCC
		midiOutput.send([0xB0,  1, 0x7f]);
		midiOutput.send([0xB0,  9, 0x7f]);
		midiOutput.send([0xB0, 17, 0x7f]);
		midiOutput.send([0xB0, 25, 0x7f]);

		arrayBufferSource.start();
		startTime = Date.now();
	}
	setInterval(() => {
		const nowTime = Date.now() - startTime;
		if (settings[0].time > nowTime) {
			return;
		}
		// 時間に達した
		element.innerHTML += `<div>${JSON.stringify(settings[0])}</div>`;
		document.querySelector("#frontRight").setAttribute("color", settings[0].frontRight);
		const frontRight = parseColor(settings[0].frontRight);
		midiOutput.send([0xB0,  2, frontRight.r]);
		midiOutput.send([0xB0,  3, frontRight.g]);
		midiOutput.send([0xB0,  4, frontRight.b]);
		document.querySelector("#frontLeft").setAttribute("color", settings[0].frontLeft);
		const frontLeft = parseColor(settings[0].frontLeft);
		midiOutput.send([0xB0, 10, frontLeft.r]);
		midiOutput.send([0xB0, 11, frontLeft.g]);
		midiOutput.send([0xB0, 12, frontLeft.b]);
		document.querySelector("#rearRight").setAttribute("color", settings[0].rearRight);
		const rearRight = parseColor(settings[0].rearRight);
		midiOutput.send([0xB0, 18, rearRight.r]);
		midiOutput.send([0xB0, 19, rearRight.g]);
		midiOutput.send([0xB0, 20, rearRight.b]);
		document.querySelector("#rearLeft").setAttribute("color", settings[0].rearLeft);
		const rearLeft = parseColor(settings[0].rearLeft);
		midiOutput.send([0xB0, 26, rearLeft.r]);
		midiOutput.send([0xB0, 27, rearLeft.g]);
		midiOutput.send([0xB0, 28, rearLeft.b]);

		settings.shift();
	}, 0);
}

/**
 * 指定音声ファイルを読み込んでArrayBufferを返す関数
 * @param {string} filePath 
 * @returns 
 */
async function getMp3ArrayBuffer(filePath) {
	const mp3File = await (await fetch(filePath)).arrayBuffer();
	return mp3File;
}

/**
 * AudioBufferSourceNode を返す関数
 * @param {ArrayBuffer} arrayBuffer 
 * @returns 
 */
async function getAudioBufferSource(arrayBuffer) {
	const context = new AudioContext();
	const gain = context.createGain();
	const source = context.createBufferSource();
	await context.decodeAudioData(arrayBuffer.slice(0), (buf) => {
		source.buffer = buf;
	});
	source.connect(gain);
	gain.connect(context.destination);

	return source;
}

/**
 * 
 * @param {string} data 
 */
function parseLightData(data) {
	const result = [];
	for (const row of data.split("\n")) {
		if (row.startsWith("#")) {
			continue;
		}
		const cells = row.split("\t").map(v => v.trim());
		result.push({
			time: Number.parseInt(cells[0]), // ミリ秒単位の時刻
			frontRight: cells[1], // 前右ライト色
			frontLeft: cells[2], // 前左ライト色
			rearRight: cells[3], // 後右ライト色
			rearLeft: cells[4], // 後左ライト色
		});
	}
	return result;
}

async function getMIDI() {
	const midiAccess = await navigator.requestMIDIAccess();
	return midiAccess.outputs;
}

/**
 * 
 * @param {string} text 
 */
function parseColor(text) {
	if (text.length !== 7) {
		return {
			r: 0, g: 0, b: 0,
		};
	}
	const r = Math.min(127, Math.floor(Number.parseInt(text.slice(1, 3), 16) / 2));
	const g = Math.min(127, Math.floor(Number.parseInt(text.slice(3, 5), 16) / 2));
	const b = Math.min(127, Math.floor(Number.parseInt(text.slice(5, 7), 16) / 2));

	return { r, g, b };
}