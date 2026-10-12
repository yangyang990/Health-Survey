export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ch', label: '中文' },
  { value: 'bm', label: 'B.Malayu' },
]

// Index in this array is the score (0 - 4)
export const SELECTION = [
  'Never or almost never have the symptom',
  'Occasionally have it, effect is not severe',
  'Occasionally have, effect is severe',
  'Frequently have it, effect is not severe',
  'Frequently have it, effect is severe',
]

export const QUESTIONS = [
  {
    label: 'DIGESTIVE TRACT',
    resultLabel: 'Digestive Tract',
    question: [
      'Nausea or Vomiting',
      'Diarrhea',
      'Constipation',
      'Bloated feeling',
      'Belching, or passing gas',
      'Heartburn',
      'Intestinal/stomach pain',
    ],
  },
  {
    label: 'EARS',
    resultLabel: 'Ears',
    question: ['Itchy ears', 'Earaches, ear infections', 'Drainage from ear', 'Ringing in ears, hearing loss'],
  },
  {
    label: 'EMOTIONS',
    resultLabel: 'Emotions',
    question: ['Mood swings', 'Anxiety, fear or nervousness', 'Anger, irritability, or aggressiveness', 'Depression'],
  },
  {
    label: 'ENERGY/ACTIVITY',
    resultLabel: 'Energy/Activity',
    question: ['Fatigue, sluggishness', 'Apathy, lethargy', 'Hyperactivity', 'Restlessness'],
  },
  {
    label: 'EYES',
    resultLabel: 'Eyes',
    question: [
      'Watery or itchy eyes',
      'Swollen, reddened or sticky eyelids',
      'Bags or dark circles under eyes',
      'Blurred or tunnel vision (does not include near-or far-sightedness)',
    ],
  },
  {
    label: 'HEAD',
    resultLabel: 'Head',
    question: ['Headaches', 'Faintness', 'Dizziness', 'Insomnia'],
  },
  {
    label: 'HEART',
    resultLabel: 'Heart',
    question: ['Irregular or skipped heartbeat', 'Rapid or pounding heartbeat', 'Chest pain'],
  },
  {
    label: 'JOINTS/MUSCLE',
    resultLabel: 'Joints/Muscle',
    question: [
      'Pain or aches in joints',
      'Arthritis',
      'Stiffness or limitation of movement',
      'Pain or aches in muscles',
      'Feeling of weakness or tiredness',
    ],
  },
  {
    label: 'LUNGS',
    resultLabel: 'Lungs',
    question: ['Chest congestion', 'Asthma, bronchitis', 'Shortness of breath', 'Difficulty breathing'],
  },
  {
    label: 'MIND',
    resultLabel: 'Mind',
    question: [
      'Poor memory',
      'Confusion, poor comprehension',
      'Poor concentration',
      'Poor physical coordination',
      'Difficulty in making decisions',
      'Stuttering or stammering',
      'Slurred speech',
      'Learning disabilities',
    ],
  },
  {
    label: 'MOUTH/THROAT',
    resultLabel: 'Mouth/Throat',
    question: [
      'Chronic coughing',
      'Gagging, frequent need to clear throat',
      'Sore throat, hoarseness, loss of voice',
      'Swollen/discolored tongue, gum, lips',
      'Canker sores',
    ],
  },
  {
    label: 'NOSE',
    resultLabel: 'Nose',
    question: ['Stuffy nose', 'Sinus problems', 'Hay fever', 'Sneezing attacks', 'Excessive mucus formation'],
  },
  {
    label: 'SKIN',
    resultLabel: 'Skin',
    question: ['Acne', 'Hives, rashes, or dry skin', 'Hair loss', 'Flushing or hot flushes', 'Excessive sweating'],
  },
  {
    label: 'WEIGHT',
    resultLabel: 'Weight',
    question: [
      'Binge eating/drinking',
      'Craving certain foods',
      'Excessive weight',
      'Compulsive eating',
      'Water retention',
      'Underweight',
    ],
  },
  {
    label: 'OTHER',
    resultLabel: 'Other',
    question: ['Frequent illness', 'Frequent or urgent urination', 'Genital itch or discharge'],
  },
]

export const INTRO_TEXT =
  'The Toxicity and Symptom Screening Questionnaire identifies symptoms that help to identify the underlying causes of illness, and helps you track your progress over time. Rate each of the following symptoms based upon your health profile for the past 30 days. If you are taking after the first time, record your symptoms for the last 48 hours ONLY.'
