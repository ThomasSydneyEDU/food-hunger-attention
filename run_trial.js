function runTrial() {
  const selectedStimuli = jsPsych.randomization.sampleWithoutReplacement(stimulus_list, 3);

  const makeClockTrial = (stimulus) => ({
    type: jsPsychCanvasKeyboardResponse,
    stimulus: function(c) {
      const ctx = c.getContext('2d');
      const centerX = c.width / 2;
      const centerY = c.height / 2;
      const radius = 200;
      const startTime = performance.now();
      const img = new Image();
      img.src = `stimuli/${stimulus.Name}.png`;

      function draw() {
        const elapsed = performance.now() - startTime;
        const angle = (elapsed / 1000) * 2 * Math.PI;

        ctx.clearRect(0, 0, c.width, c.height);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        const dotX = centerX + radius * Math.sin(angle);
        const dotY = centerY - radius * Math.cos(angle);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 15, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX + 10, centerY);
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX, centerY + 10);
        ctx.stroke();

        if (img.complete) {
          const size = 100;
          ctx.drawImage(img, centerX - size / 2, centerY - size / 2, size, size);
        }

        if (performance.now() - startTime < 5000) {
          requestAnimationFrame(draw);
        }
      }

      draw();
    },
    canvas_size: [800, 600],
    choices: "NO_KEYS",
    trial_duration: 5000,
  });

  const trials = selectedStimuli.flatMap((stimulus, index) => [
    makeClockTrial(stimulus),
    ...(index < 2 ? [{ type: jsPsychHtmlKeyboardResponse, stimulus: '', choices: "NO_KEYS", trial_duration: 1000 }] : [])
  ]);

  jsPsych.run(trials.concat({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '',
    choices: "NO_KEYS",
    trial_duration: 0,
    on_start: () => {
      document.getElementById('show-trial-button').style.display = 'inline-block';
    }
  }));
}
