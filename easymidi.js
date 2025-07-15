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