async function sendMidi() {
	let startTime = 0;
	const arrayBufferSource = await getAudioBufferSource(await getMp3ArrayBuffer("./data/BLACK SHOUT.mp3"));
	let settings = parseLightData(await (await fetch("./settings.tsv")).text()).sort((a, b) => a.time - b.time);
	let intervalId = 0;

	const midi = new EasyMidi(await EasyMidi.initValue());

	{ // 再生処理
		arrayBufferSource.start();
		startTime = Date.now();
		document.querySelector("#button").disabled = true;
	}

	let nowData = new LightData();
	let i = 0;

	const interval = () => {
		i++;
		const nowTime = Date.now() - startTime;
		if (settings.length === 0) {
			/// 終了処理
			clearInterval(intervalId);
			arrayBufferSource.stop();
			document.querySelector("#button").disabled = false;
		}
		if (settings[0].time > nowTime) {
			return;
		}

		nowData = settings.shift();

		document.querySelector("#frontRight").setAttribute("color", toHex(frontRight));
		document.querySelector("#frontLeft").setAttribute("color", toHex(frontLeft));
		document.querySelector("#rearRight").setAttribute("color", toHex(rearRight));
		document.querySelector("#rearLeft").setAttribute("color", toHex(rearLeft));
		
		midi.sendBank(29);
		midi.sendScene(nowData.sceneIndex);
		console.log(nowData);
	};
	intervalId = setInterval(interval, 0);
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
 * @returns {LightData[]}
 */
function parseLightData(data) {
	/**
	 * @type {LightData[]}
	 */
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
			fadeTime: Number.parseInt(cells[5]), // 切換時間
			beforeData: result[result.length - 1] || null, // 前のデータ
			sceneIndex: Number.parseInt(cells[6]), // インデックス
		});
	}
	return result;
}

function interpolationColor(a, b, ratio) {
	const aColor = parseColor(a);
	const bColor = parseColor(b);

	return {
		r: Math.floor(aColor.r * (1 - ratio) + bColor.r * ratio),
		g: Math.floor(aColor.g * (1 - ratio) + bColor.g * ratio),
		b: Math.floor(aColor.b * (1 - ratio) + bColor.b * ratio),
	};
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

function toHex(color) {
	return `#${Number.parseInt(color.r * 2).toString(16).padStart(2, "0")}${Number.parseInt(color.g * 2).toString(16).padStart(2, "0")}${Number.parseInt(color.b * 2).toString(16).padStart(2, "0")}`;
}

class LightData {
	time = 0;
	frontRight = "#000000";
	frontLeft = "#000000";
	rearRight = "#000000";
	rearLeft = "#000000";
	fadeTime = 0;
	beforeData = null;
	sceneIndex = 0;
}

function ease(x) {
	return 1 - Math.pow(1 - x, 3);
}