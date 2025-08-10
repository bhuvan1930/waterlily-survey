import { Question } from '../types';

export const questions: Question[] = [
  { id: 'age', title: 'Age', description: 'How old are you?', type: 'number' },
  { id: 'gender', title: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { id: 'bio', title: 'Short Bio', description: 'Tell us about yourself.', type: 'text' },
];
