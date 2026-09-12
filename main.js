import './style.css'
import { generateStudyPlan } from './studyPlanner.js'

document.querySelector('#app').innerHTML = `
  <header class="header">
    <div class="header-content">
      <div class="header-badge">
        <span class="dot"></span>
        AI-Powered Study Planning
      </div>
      <h1>AI <span class="gradient-text">StudyMate</span></h1>
      <p>Your personalized AI study planner. Tell us your subjects, exam dates, and strengths — we'll build a smart, prioritized study schedule just for you.</p>
    </div>
  </header>

  <main class="main">
    <section class="form-card">
      <h2 class="form-card-title">Tell Us About Your Studies</h2>
      <p class="form-card-subtitle">Fill in the details below and we'll generate a personalized study plan tailored to your needs.</p>

      <form id="study-form" class="form-grid" novalidate>
        <div class="form-field">
          <label class="form-label" for="name">Your Name <span class="required">*</span></label>
          <input class="form-input" type="text" id="name" name="name" placeholder="e.g. Alex Johnson" required />
        </div>

        <div class="form-field">
          <label class="form-label" for="course">Course / Program <span class="required">*</span></label>
          <input class="form-input" type="text" id="course" name="course" placeholder="e.g. B.Tech Computer Science" required />
        </div>

        <div class="form-field full">
          <label class="form-label" for="subjects">Subjects (comma-separated) <span class="required">*</span></label>
          <input class="form-input" type="text" id="subjects" name="subjects" placeholder="e.g. Math, Physics, Chemistry, English, Programming" required />
          <span class="form-hint">List all the subjects you need to study for this exam.</span>
        </div>

        <div class="form-field">
          <label class="form-label" for="examDate">Exam Date <span class="required">*</span></label>
          <input class="form-input" type="date" id="examDate" name="examDate" required />
        </div>

        <div class="form-field">
          <label class="form-label" for="dailyHours">Daily Study Hours <span class="required">*</span></label>
          <input class="form-input" type="number" id="dailyHours" name="dailyHours" min="1" max="16" step="0.5" placeholder="e.g. 5" required />
          <span class="form-hint">How many hours can you study per day?</span>
        </div>

        <div class="form-field">
          <label class="form-label" for="strongSubjects">Strong Subjects (comma-separated)</label>
          <input class="form-input" type="text" id="strongSubjects" name="strongSubjects" placeholder="e.g. Programming, English" />
          <span class="form-hint">Subjects you're already confident in.</span>
        </div>

        <div class="form-field">
          <label class="form-label" for="weakSubjects">Weak Subjects (comma-separated)</label>
          <input class="form-input" type="text" id="weakSubjects" name="weakSubjects" placeholder="e.g. Math, Physics" />
          <span class="form-hint">Subjects you find difficult — these get more time.</span>
        </div>

        <div class="form-error" id="form-error"></div>

        <button class="btn-generate" type="submit" id="generate-btn">
          <span class="btn-content">
            <span class="spinner"></span>
            <span class="btn-label">Generate My Study Plan</span>
          </span>
        </button>
      </form>
    </section>

    <section class="results-section" id="results-section">
      <div class="results-placeholder">
        <div class="icon">[ ]</div>
        <p>Your personalized study plan will appear here after you fill in the form above.</p>
      </div>
    </section>
  </main>

  <footer class="footer">
    <p>Built for the Hackathon &middot; AI StudyMate &middot; <a href="#">How it works</a></p>
  </footer>
`

const form = document.querySelector('#study-form')
const generateBtn = document.querySelector('#generate-btn')
const resultsSection = document.querySelector('#results-section')
const errorBox = document.querySelector('#form-error')

const todayStr = new Date().toISOString().split('T')[0]
document.querySelector('#examDate').min = todayStr

form.addEventListener('submit', (e) => {
  e.preventDefault()
  errorBox.classList.remove('show')

  const data = {
    name: form.name.value.trim(),
    course: form.course.value.trim(),
    subjects: form.subjects.value.trim(),
    examDate: form.examDate.value,
    dailyHours: parseFloat(form.dailyHours.value),
    strongSubjects: form.strongSubjects.value.trim(),
    weakSubjects: form.weakSubjects.value.trim(),
  }

  const error = validateForm(data)
  if (error) {
    errorBox.textContent = error
    errorBox.classList.add('show')
    return
  }

  generateBtn.classList.add('loading')
  generateBtn.disabled = true

  setTimeout(() => {
    const plan = generateStudyPlan(data)
    renderPlan(plan)
    generateBtn.classList.remove('loading')
    generateBtn.disabled = false
  }, 900)
})

function validateForm(data) {
  if (!data.name) return 'Please enter your name.'
  if (!data.course) return 'Please enter your course or program.'
  if (!data.subjects) return 'Please list at least one subject.'
  if (!data.examDate) return 'Please select your exam date.'
  if (!data.dailyHours || data.dailyHours < 1) return 'Please enter at least 1 hour of daily study time.'
  if (data.dailyHours > 16) return 'Daily study hours cannot exceed 16.'
  return null
}

function renderPlan(plan) {
  const examDate = new Date(form.examDate.value)
  const examDateStr = examDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const subjectCards = plan.subjectPlan
    .map(
      (s) => `
      <div class="subject-card ${s.priority}">
        <div class="subject-info">
          <div class="subject-name">${s.name}</div>
          <span class="subject-tag ${s.priority}">${
        s.priority === 'weak' ? 'Weak Area' : s.priority === 'strong' ? 'Strong Area' : 'Normal'
      }</span>
        </div>
        <div class="subject-bar">
          <div class="fill ${s.priority}" style="width: ${s.percentage}%"></div>
        </div>
        <div class="subject-time">
          <div class="hours">${s.hoursPerDay}h</div>
          <div class="unit">/ day (${s.percentage}%)</div>
        </div>
      </div>
    `
    )
    .join('')

  const scheduleRows = plan.schedule
    .map(
      (slot) => `
      <div class="schedule-row">
        <div class="schedule-time">${slot.time}</div>
        <div class="schedule-subject">${slot.subject}</div>
        <div class="schedule-activity">${slot.activity}</div>
      </div>
    `
    )
    .join('')

  const tipsItems = plan.tips
    .map(
      (tip, i) => `
      <li>
        <span class="tip-icon">${i + 1}</span>
        <span>${tip}</span>
      </li>
    `
    )
    .join('')

  resultsSection.innerHTML = `
    <div class="plan-card">
      <div class="plan-header">
        <h2>${plan.name}'s Study Plan</h2>
        <p>${plan.course} &middot; Exam on ${examDateStr}</p>
      </div>
      <div class="plan-body">
        <div class="plan-stats">
          <div class="stat-box">
            <div class="stat-value">${plan.daysUntilExam}</div>
            <div class="stat-label">Days to Exam</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${plan.dailyHours}h</div>
            <div class="stat-label">Daily Study</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${plan.subjectCount}</div>
            <div class="stat-label">Subjects</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${Math.round(plan.daysUntilExam * plan.dailyHours)}h</div>
            <div class="stat-label">Total Study Time</div>
          </div>
        </div>

        <h3 class="plan-section-title">Subject Time Allocation</h3>
        <div class="subject-list">${subjectCards}</div>

        <h3 class="plan-section-title">Suggested Daily Schedule</h3>
        <div class="daily-schedule">${scheduleRows}</div>

        <h3 class="plan-section-title">Personalized Tips</h3>
        <ul class="tips-list">${tipsItems}</ul>
      </div>
    </div>
  `

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
