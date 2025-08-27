// Certif.js | The certification manager with Turnstile protection - Updated for new API
const quizForm = document.getElementById('quiz-form');
const submitButton = quizForm.querySelector('.submit-button');
const quizSection = document.querySelector(".quiz-section");
const TURNSTILE_SITE_KEY = '0x4AAAAAABeZwqhQ3FcnOkEe';
let quizQuestions = [];
let timerStart = null;
let timerInterval = null;
let quizInvalidated = false;
let tabSwitchDetectionEnabled = false;

class TabSwitchDetector {
  constructor() {
    this.isActive = false;
    this.switchCount = 0;
    this.onTabSwitch = null;
  }

  enable(callback) {
    if (this.isActive) return;

    this.isActive = true;
    this.onTabSwitch = callback;
    this.switchCount = 0;

    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    log('Tab switch detection enabled', 'warning');
  }

  disable() {
    if (!this.isActive) return;

    this.isActive = false;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('blur', this.handleWindowBlur.bind(this));
    window.removeEventListener('focus', this.handleWindowFocus.bind(this));
    document.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));

    log('Tab switch detection disabled', 'warning');
  }

  handleVisibilityChange() {
    if (document.hidden && this.isActive) {
      this.switchCount++;
      log(`Tab switch detected (visibility) - Count: ${this.switchCount}`, 'warning');
      this.triggerInvalidation('tab switch');
    }
  }

  handleWindowBlur() {
    if (this.isActive) {
      this.switchCount++;
      log(`Window blur detected - Count: ${this.switchCount}`, 'warning');
      this.triggerInvalidation('window focus loss');
    }
  }

  handleWindowFocus() {
    if (this.isActive && this.switchCount > 0) {
      log('Window focus regained, but quiz already invalidated', 'warning');
    }
  }

  handleContextMenu(e) {
    if (this.isActive) {
      e.preventDefault();
      log('Context menu blocked during quiz', 'warning');
      this.triggerInvalidation('context menu attempt');
    }
  }

  handleKeyDown(e) {
    if (!this.isActive) return;

    const blockedKeys = [
      { key: 'F12' },
      { key: 'I', ctrl: true, shift: true },
      { key: 'J', ctrl: true, shift: true },
      { key: 'C', ctrl: true, shift: true },
      { key: 'U', ctrl: true }
    ];

    for (const blocked of blockedKeys) {
      if (e.key === blocked.key &&
        (!blocked.ctrl || e.ctrlKey) &&
        (!blocked.shift || e.shiftKey)) {
        e.preventDefault();
        log(`Blocked key combination: ${e.key}`, 'warning');
        this.triggerInvalidation('developer tools attempt');
        return;
      }
    }
  }

  triggerInvalidation(reason) {
    if (!this.isActive) return;

    log(`Quiz invalidated due to: ${reason}`, 'error');
    this.disable();

    if (this.onTabSwitch) {
      this.onTabSwitch(reason);
    }
  }
}

const tabSwitchDetector = new TabSwitchDetector();

function startTimer() {
  if (timerStart === null) {
    timerStart = new Date();
    startAchievement('Speed Runner');
  }
}

function stopTimer() {
  if (timerStart !== null) {
    const elapsed = Math.floor((new Date() - timerStart) / 1000);
    clearInterval(timerInterval);
    timerStart = null;
    log(`Timer stopped. Total time: ${elapsed} seconds`, 'success');
    return elapsed;
  }
  return 0;
}

function enableTabSwitchDetection() {
  if (!tabSwitchDetectionEnabled) {
    tabSwitchDetectionEnabled = true;
    tabSwitchDetector.enable((reason) => {
      quizInvalidated = true;
      stopTimer();
      displayInvalidatedQuiz();
    });
  }
}

function disableTabSwitchDetection() {
  if (tabSwitchDetectionEnabled) {
    tabSwitchDetectionEnabled = false;
    tabSwitchDetector.disable();
  }
}

function displayInvalidatedQuiz() {
  const existingQuestions = document.querySelectorAll('.question-group');
  existingQuestions.forEach((q) => q.remove());

  const existingMessage = quizForm.querySelector('.quiz-message');
  if (existingMessage) existingMessage.remove();

  const message = document.createElement('p');
  message.innerHTML = `
    Quiz Invalidated!
    <br><br>
    The quiz was invalidated because you did a forbidden action during the test. 
    This is to ensure test integrity.
    <br><br>
    <a onclick="redoQuiz()" class="submit-button" style="margin-top: 15px;">
      Restart quiz
    </a>
  `;
  message.className = 'quiz-message';
  quizForm.appendChild(message);
  submitButton.style.display = 'none';
}

async function loadQuestions() {
  try {
    const response = await fetch('/api/certificate/');
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to load questions');
    quizQuestions = data.questions.map(q => ({
      question: q.question,
      options: q.answers.map(a => a.content),
      answer: q.answers.find((a, index) => index === (q.correct_answer_id - 1))?.content || q.answers[0].content,
      correct_answer_id: q.correct_answer_id
    }));
    log('Questions loaded successfully!', 'success');
    return true;
  } catch (error) {
    log('Error loading questions: ' + error.message, 'error');
    return false;
  }
}

async function createQuestions() {
  if (quizQuestions.length === 0) {
    const loaded = await loadQuestions();
    if (!loaded) {
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'Error loading quiz questions. Please try again later.';
      errorMessage.className = 'quiz-message';
      quizForm.appendChild(errorMessage);
      return;
    }
  }

  timerStart = null;
  if (timerInterval) clearInterval(timerInterval);

  submitButton.style.display = 'flex';
  const existingMessage = quizForm.querySelector('.quiz-message');
  if (existingMessage) existingMessage.style.display = 'none';

  const existingQuestions = document.querySelectorAll('.question-group');
  if (existingQuestions.length > 0) {
    existingQuestions.forEach((q) => q.remove());
  }

  quizQuestions.forEach((question, index) => {
    const questionGroup = document.createElement('div');
    questionGroup.className = 'question-group';

    const questionText = document.createElement('p');
    questionText.className = 'question-text';
    questionText.textContent = `${index + 1}. ${question.question}`;

    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';

    question.options.forEach((option, optionIndex) => {
      const label = document.createElement('label');
      label.className = 'radio-label';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${index + 1}`;
      input.value = optionIndex + 1;
      input.className = 'radio-input';

      input.addEventListener('change', () => {
        if (timerStart === null) {
          startTimer();
          enableTabSwitchDetection();
        }
      });

      const span = document.createElement('span');
      span.className = 'radio-text';
      span.textContent = option;

      label.appendChild(input);
      label.appendChild(span);
      radioGroup.appendChild(label);
    });

    questionGroup.appendChild(questionText);
    questionGroup.appendChild(radioGroup);
    submitButton.parentNode.insertBefore(questionGroup, submitButton);
    log(`Question ${index + 1} added!`, 'success');
  });
}

async function checkQuizResponses() {
  if (quizInvalidated) {
    alert('This quiz has been invalidated and cannot be submitted.');
    return;
  }

  const userAnswers = {};
  let allAnswered = true;

  quizQuestions.forEach((question, index) => {
    const questionId = index + 1;
    const selectedInput = quizForm.querySelector(`input[name="q${questionId}"]:checked`);
    if (selectedInput) {
      userAnswers[questionId] = parseInt(selectedInput.value);
    } else {
      allAnswered = false;
    }
  });

  if (!allAnswered) {
    alert('Please answer all questions before submitting.');
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('action', 'check');
    Object.keys(userAnswers).forEach(questionId => {
      params.append(questionId, userAnswers[questionId]);
    });

    const response = await fetch(`/api/certificate/?${params}`);
    const data = await response.json();

    if (!data.success) throw new Error(data.message || 'Failed to check answers');

    disableTabSwitchDetection();

    displayQuizResults(data);
    localStorage.setItem('quizTaken', 'true');
    log('quizTaken set to true', 'warning');

    const timeTaken = stopTimer();

    if (data.passed) {
      if (data.correct_answers >= 15 && timeTaken <= 20) {
        addAchievement('Speed Runner');
      }
      offerCertificate(data.percentage, userAnswers);
    }
  } catch (error) {
    log('Error checking answers: ' + error.message, 'error');
    alert('Error checking your answers. Please try again.');
  }
}

function displayQuizResults(results) {
  quizForm.querySelectorAll('.radio-label').forEach(label => {
    label.classList.remove('correct', 'incorrect', 'show-correct');
  });

  results.details.forEach(detail => {
    const questionId = detail.question_id;
    const userAnswerId = detail.user_answer;
    const correctAnswerId = detail.correct_answer;
    const selectedInput = quizForm.querySelector(`input[name="q${questionId}"][value="${userAnswerId}"]`);

    if (selectedInput) {
      const selectedLabel = selectedInput.closest('.radio-label');
      if (detail.is_correct) {
        selectedLabel.classList.add('correct');
        log(`Question ${questionId}: Correct!`, 'success');
      } else {
        selectedLabel.classList.add('incorrect');
        log(`Question ${questionId}: Incorrect!`, 'warning');
        const correctInput = quizForm.querySelector(`input[name="q${questionId}"][value="${correctAnswerId}"]`);
        if (correctInput) {
          const correctLabel = correctInput.closest('.radio-label');
          correctLabel.classList.add('show-correct');
        }
      }
    }
  });

  quizForm.querySelectorAll('input[type="radio"]').forEach(input => {
    input.disabled = true;
  });

  submitButton.disabled = true;
  submitButton.textContent = `Score: ${results.correct_answers}/${results.total_questions} (${results.percentage}%)`;
}

function offerCertificate(percentage, userAnswers) {
  const existingCertificate = document.querySelector('.certificate-section');
  if (existingCertificate) {
    log('Certificate section already here: Not doing anything!', 'warning')
    return;
  }

  const certificateSection = document.createElement('div');
  certificateSection.className = 'certificate-section';

  const message = document.createElement('p');
  message.textContent = `Congrats! You got ${percentage}%. Give us your name to download the certificate:`;

  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.placeholder = 'Your name';
  usernameInput.className = 'input-text';

  const totalPercent = getTotalPercent();
  let achievementCheckbox = null;
  let achievementContainer = null;

  if (totalPercent > 0) {
    achievementContainer = document.createElement('div');
    achievementContainer.className = 'achievement-container';
    achievementContainer.style.marginTop = '15px';
    achievementContainer.style.marginBottom = '15px';

    const achievementLabel = document.createElement('label');
    achievementLabel.className = 'achievement-label';
    achievementLabel.style.display = 'flex';
    achievementLabel.style.alignItems = 'center';
    achievementLabel.style.cursor = 'pointer';

    achievementCheckbox = document.createElement('input');
    achievementCheckbox.type = 'checkbox';
    achievementCheckbox.className = 'achievement-checkbox';
    achievementCheckbox.style.marginRight = '10px';

    const achievementText = document.createElement('span');
    achievementText.textContent = `Add ${totalPercent}% to your score? (Achievements)`;
    achievementText.style.fontSize = '14px';

    achievementLabel.appendChild(achievementCheckbox);
    achievementLabel.appendChild(achievementText);
    achievementContainer.appendChild(achievementLabel);
  }

  const turnstileContainer = document.createElement('div');
  turnstileContainer.className = 'turnstile-container';
  turnstileContainer.style.marginTop = '15px';
  turnstileContainer.style.marginBottom = '15px';

  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download';
  downloadButton.className = 'submit-button';
  downloadButton.disabled = true;

  let turnstileWidgetId = null;
  let turnstileToken = null;

  function onTurnstileSuccess(token) {
    turnstileToken = token;
    downloadButton.disabled = false;
    downloadButton.style.opacity = '1';
    downloadButton.style.cursor = 'pointer';
    log('Turnstile validated successfully!', 'success');
  }

  function onTurnstileError() {
    turnstileToken = null;
    downloadButton.disabled = true;
    downloadButton.style.opacity = '0.5';
    downloadButton.style.cursor = 'not-allowed';
    log('Turnstile validation failed!', 'error');
  }

  function onTurnstileExpired() {
    turnstileToken = null;
    downloadButton.disabled = true;
    downloadButton.style.opacity = '0.5';
    downloadButton.style.cursor = 'not-allowed';
    log('Turnstile token expired!', 'warning');
  }

  downloadButton.style.opacity = '0.5';
  downloadButton.style.cursor = 'not-allowed';

  if (typeof turnstile !== 'undefined') {
    turnstileWidgetId = turnstile.render(turnstileContainer, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: onTurnstileSuccess,
      'error-callback': onTurnstileError,
      'expired-callback': onTurnstileExpired,
      theme: 'dark',
      size: 'normal'
    });
  } else {
    log('Turnstile not loaded, fallback mode', 'warning');
    downloadButton.disabled = false;
    downloadButton.style.opacity = '1';
    downloadButton.style.cursor = 'pointer';
  }

  downloadButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) {
      alert('Please enter a valid name.');
      return;
    }
    if (typeof turnstile !== 'undefined' && !turnstileToken) {
      alert('Please complete the security verification.');
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('action', 'download');
      params.append('name', username);
      Object.keys(userAnswers).forEach(questionId => {
        params.append(questionId, userAnswers[questionId]);
      });
      if (turnstileToken) {
        params.append('turnstile_token', turnstileToken);
      }

      if (achievementCheckbox && achievementCheckbox.checked) {
        const userId = getUserId();
        if (userId) {
          params.append('userId', userId);
          log(`Adding userId ${userId} to certificate request`, 'success');
        }
      }

      if (percentage >= 80) addAchievement('Certified NoSkid');
      if (percentage === 100) addAchievement('Perfect Score');

      const downloadUrl = `/api/certificate/?${params}`;
      downloadButton.disabled = true;
      downloadButton.textContent = 'Downloading...';

      window.location.href = downloadUrl;
      log('Certificate download initiated!', 'success');

      setTimeout(() => {
        quizForm.innerHTML = `
  <p>✅ Certificate downloaded! Check if a certificate is valid with 'Shift + C'</p>
  <br>
  <p>Check out what you can do with it: <a href="https://blog.noskid.today/?p=3-noskid-services" target="_blank">noskid services</a></p>
  <hr>
  <p>If you like this website consider adding a star to
    <a href="https://github.com/dpipstudio/noskid.today" target="_blank">the GitHub</a> <3
  </p>
`;
        certificateSection.style.display = 'none';
      }, 2000);
    } catch (error) {
      log('Error downloading certificate: ' + error.message, 'error');
      alert('Error downloading certificate. Please try again.');
      downloadButton.disabled = false;
      downloadButton.textContent = 'Download';
    }
  });

  certificateSection.appendChild(message);
  certificateSection.appendChild(usernameInput);
  if (achievementContainer) certificateSection.appendChild(achievementContainer);
  certificateSection.appendChild(turnstileContainer);
  certificateSection.appendChild(downloadButton);
  quizForm.appendChild(certificateSection);
  log('Certificate section with Turnstile showed!', 'success');
}

async function handleQuizDisplay() {
  if (localStorage.getItem('quizTaken') === 'true') {
    const message = document.createElement('p');
    message.innerHTML = `❌ You have already taken this test.
      <br>
      You can still check the <a href="https://blog.noskid.today/?p=3-noskid-services" target="_blank">noskid services</a> or do the quiz again by typing 'bypass' ! (PS: If you like this website, consider <a href="https://noskid.today/#spawnCommentSystem">leaving a comment</a>)`;
    message.className = 'quiz-message';
    quizForm.appendChild(message);
    submitButton.style.display = 'none';
    log('Quiz has already been taken.', 'warning')
  } else {
    await createQuestions();
    quizForm.addEventListener('submit', (e) => {
      e.preventDefault();
      checkQuizResponses();
    });
  }
}

async function redoQuiz(event) {
  if (event) event.preventDefault();

  quizInvalidated = false;
  tabSwitchDetectionEnabled = false;
  timerStart = null;

  const quizContainer = document.querySelector('.quiz-container');
  if (quizContainer) {
    quizContainer.open = true;
    log('Quiz opened!', 'success');
  } else {
    log('Quiz container not found!', 'error');
    return;
  }
  await createQuestions();
  log('Recreated questions!', 'success')
  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    checkQuizResponses();
  });
}

handleQuizDisplay();