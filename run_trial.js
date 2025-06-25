let trialDataLog = [];
let drawCallback = null;

function adjustAngle(e) {
  if (e.code === "ArrowLeft") {
    currentAngle -= Math.PI / 60;
    if (drawCallback) drawCallback();
  }
  if (e.code === "ArrowRight") {
    currentAngle += Math.PI / 60;
    if (drawCallback) drawCallback();
  }
}

function runTrial() {
  const selectedStimuli = jsPsych.randomization.sampleWithoutReplacement(stimulus_list, 3);

  const makeClockTrial = (stimulus) => {
    const randomAngle = Math.random() * 2 * Math.PI;
    let currentAngle = randomAngle;
    let userAngle = randomAngle;
    let imageOnsetTime = null;
    let imageOnsetAngle = null;

    return [
      {
        type: jsPsychCanvasKeyboardResponse,
        stimulus: function(c) {
          const ctx = c.getContext('2d');
          const centerX = c.width / 2;
          const centerY = c.height / 2;
          const radius = 200;
          let startTime;
          const img = new Image();
          img.src = `stimuli/${stimulus.Name}.png`;
          const imageDelay = 1000 + Math.random() * 1500;

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

            if (performance.now() - startTime >= imageDelay && img.complete) {
              if (imageOnsetTime === null) {
                imageOnsetTime = performance.now() - startTime;
                imageOnsetAngle = angle;
              }
              const size = 200;
              ctx.drawImage(img, centerX - size / 2, centerY - size / 2, size, size);
            }

            if (performance.now() - startTime < 4000) {
              requestAnimationFrame(draw);
            }
          }

          startTime = performance.now();
          draw();
        },
        canvas_size: [800, 600],
        choices: "NO_KEYS",
        trial_duration: 4000,
        on_finish: (data) => {
          data.image_onset_angle = imageOnsetAngle;
          data.image_onset_time = imageOnsetTime;
          data.stimulus_name = stimulus.Name;
          data.phase = 'image_clock';
          data.image_onset_angle_pi = imageOnsetAngle / Math.PI;
          data.final_angle = null;
          data.final_angle_pi = null;
          trialDataLog.push(data);
        }
      },
      {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: '',
        choices: "NO_KEYS",
        trial_duration: 1000
      },
      {
        type: jsPsychCanvasKeyboardResponse,
        stimulus: function(c) {
          const ctx = c.getContext('2d');
          const centerX = c.width / 2;
          const centerY = c.height / 2;
          const radius = 200;

          function draw() {
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();

            const dotX = centerX + radius * Math.sin(userAngle);
            const dotY = centerY - radius * Math.cos(userAngle);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 15, 0, 2 * Math.PI);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(centerX - 10, centerY);
            ctx.lineTo(centerX + 10, centerY);
            ctx.moveTo(centerX, centerY - 10);
            ctx.lineTo(centerX, centerY + 10);
            ctx.stroke();
          }

          drawCallback = draw;

          draw();
          return c;
        },
        canvas_size: [800, 600],
        choices: ["arrowup"],
        response_ends_trial: true,
        on_load: () => {
          function adjustAngle(e) {
            if (e.code === "ArrowLeft") {
              userAngle -= Math.PI / 60;
              drawCallback();
            }
            if (e.code === "ArrowRight") {
              userAngle += Math.PI / 60;
              drawCallback();
            }
          }
          document.addEventListener("keydown", adjustAngle);
          jsPsych.getCurrentTrial().adjustAngle = adjustAngle;
        },
        on_finish: function(data) {
          document.removeEventListener("keydown", jsPsych.getCurrentTrial().adjustAngle);

          console.log('userAngle at finish:', userAngle);
          if (typeof userAngle === 'number') {
            const normalizedFinalAngle = userAngle % (2 * Math.PI);
            data.final_angle = normalizedFinalAngle;
            data.final_angle_pi = normalizedFinalAngle / Math.PI;
            data.final_angle_deg = normalizedFinalAngle * (180 / Math.PI);
          } else {
            data.final_angle = 'NaN';
            data.final_angle_pi = 'NaN';
            data.final_angle_deg = 'NaN';
          }
          data.stimulus_name = stimulus.Name;
          data.phase = 'adjustment_phase';

          if (typeof imageOnsetAngle === 'number') {
            const normalizedOnsetAngle = imageOnsetAngle % (2 * Math.PI);
            data.image_onset_angle = normalizedOnsetAngle;
            data.image_onset_angle_pi = normalizedOnsetAngle / Math.PI;
            data.image_onset_angle_deg = normalizedOnsetAngle * (180 / Math.PI);
          } else {
            data.image_onset_angle = null;
            data.image_onset_angle_pi = null;
            data.image_onset_angle_deg = null;
          }

          if (typeof imageOnsetTime === 'number') {
            data.image_onset_time = imageOnsetTime;
          } else {
            data.image_onset_time = null;
          }

          trialDataLog.push(data);
        }
      }
    ];
  };

  const trials = selectedStimuli.flatMap((stimulus) => makeClockTrial(stimulus));

  jsPsych.run(trials.concat({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '',
    choices: "NO_KEYS",
    trial_duration: 0,
    on_start: () => {
      const btn = document.getElementById('show-trial-button');
      if (btn) btn.style.display = 'inline-block';

      if (trialDataLog.length > 0) {
        const headers = [
          'rt', 'response', 'trial_type', 'trial_index', 'time_elapsed', 'internal_node_id',
          'image_onset_angle', 'image_onset_time', 'stimulus_name', 'phase',
          'image_onset_angle_pi', 'image_onset_angle_deg',
          'final_angle', 'final_angle_pi', 'final_angle_deg'
        ];
        const header = headers.join(',');
        const rows = trialDataLog.map(row =>
          headers.map(h => row[h] !== undefined ? row[h] : '').join(',')
        ).join('\n');
        const csvContent = [header, rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'trial_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }));
}
