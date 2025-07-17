class EasyMidi {
	/**
	 * @type {MIDIOutput}
	 */
	#midiOutput = null;

	constructor(midiOutput) {
		this.#midiOutput = midiOutput;
	}

	/**
	 * 
	 * @param {Number[]} bytes 
	 */
	send(bytes) {
		bytes = bytes.map(v => Math.floor(v));
		console.log(`0x${bytes[0].toString(16).padStart(2, "0")} ${bytes[1]} ${bytes[2]}`);
		this.#midiOutput.send(bytes);
	}
	/**
	 * @param {number} sceneIndex 
	 */
	sendScene(sceneIndex) {
		if (sceneIndex < 1 && 8 < sceneIndex) {
			throw new Error("範囲外だぜ〜〜〜");
		}
		this.send([0x90, 11 + sceneIndex, 127]);
	}
	/**
	 * @param {number} bankIndex 
	 */
	sendBank(bankIndex) {
		if (bankIndex < 1 && 30 < bankIndex) {
			throw new Error("範囲外だぜ〜〜〜");
		}
		this.send([0x90, 19 + bankIndex, 127]);
	}
	/**
	 * 
	 * @param {string} id 
	 */
	sendLightIndexn(id) {
		if (id.length !== 3) {
			throw new Error("id is not valid.");
		}
		const bank = Number.parseInt(id.substring(1, 3));
		const scene = Number.parseInt(id.substring(0, 1));

		this.sendBank(bank);
		this.sendScene(scene);
	}

	static async initValue() {
		const midiAccess = await navigator.requestMIDIAccess();
		if (midiAccess.outputs.size == 0) {
			const element = document.querySelector("#output");
			element.innerHTML += `<div>MIDIがなかったよーん</div>`;
			return;
		}
		const midiOutput = [...midiAccess.outputs.values()][0];
		return midiOutput;
	}
}