export const setupAkai = async () => {
  const faders = Array.from({ length: 9 }, () => 0);
  const onPad = new Set<(x: number, y: number) => void>();

  const access = await navigator.requestMIDIAccess();
  access.inputs.forEach((input) => {
    input.addEventListener("midimessage", (evt) => {
      const codes = {
        noteOff: 0x80,
        noteOn: 0x90,
        continuous: 0xb0,
      };
      const [a, b, c] = evt.data;
      if (a === codes.noteOn) {
        const x = b % 8;
        const y = b >> 3;
        for (const listener of onPad) listener(x, y);
      }
      if (a === codes.continuous) {
        faders[b - 48] = c / 127;
      }
    });
  });

  return { faders, onPad };
};
