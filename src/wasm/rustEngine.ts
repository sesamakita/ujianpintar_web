/**
 * UjianPintar High-Performance Rust & WebAssembly Integration Bridge
 * Mirrors Rust `ujianpintar-core` crate for ultra-fast scoring & anti-cheat integrity
 */

export interface RustQuestionItem {
  id: string;
  question_type: string;
  correct_option_id?: string;
  correct_answer_text?: string;
  points: number;
}

export interface RustStudentAnswerItem {
  question_id: string;
  selected_option_id?: string;
  answer_text?: string;
}

export interface RustGradeResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  status: 'Lulus' | 'Remedial' | 'Menunggu Koreksi';
  correctCount: number;
  totalQuestions: number;
  hasPendingEssays: boolean;
  objectiveScore: number;
  objectiveMax: number;
  shortAnswerScore: number;
  shortAnswerMax: number;
  essayScore: number;
  essayMax: number;
  details: Record<string, { isCorrect: boolean; pointsEarned: number }>;
}

export class RustEngineBridge {
  /**
   * Fast auto-grading algorithm matching ujianpintar-core in Rust
   */
  static gradeExam(
    questions: RustQuestionItem[],
    answers: RustStudentAnswerItem[],
    kkm: number = 75
  ): RustGradeResult {
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let hasPendingEssays = false;
    let objectiveScore = 0;
    let objectiveMax = 0;
    let shortAnswerScore = 0;
    let shortAnswerMax = 0;
    const details: Record<string, { isCorrect: boolean; pointsEarned: number }> = {};

    for (const q of questions) {
      maxScore += q.points || 10;
      const ans = answers.find((a) => a.question_id === q.id);

      if (q.question_type === 'essay') {
        // Essay answers require teacher / AI grading, initially 0 points pending
        hasPendingEssays = true;
        details[q.id] = { isCorrect: false, pointsEarned: 0 };
        continue;
      }

      if (ans) {
        let isCorrect = false;

        if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
          isCorrect = !!q.correct_option_id && ans.selected_option_id === q.correct_option_id;
          if (isCorrect) {
            objectiveScore += q.points || 10;
          }
          objectiveMax += q.points || 10;
        } else if (q.question_type === 'short_answer') {
          if (q.correct_answer_text && ans.answer_text) {
            const cleanC = q.correct_answer_text.trim().toLowerCase().replace(/,/g, '.');
            const cleanU = ans.answer_text.trim().toLowerCase().replace(/,/g, '.');
            isCorrect = cleanC === cleanU;
          }
          if (isCorrect) {
            shortAnswerScore += q.points || 10;
          }
          shortAnswerMax += q.points || 10;
        }

        if (isCorrect) {
          totalScore += q.points || 10;
          correctCount++;
        }
      }

      details[q.id] = { isCorrect: false, pointsEarned: 0 };
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // If exam has essays and current objective score hasn't passed KKM, status is pending essay review
    let status: 'Lulus' | 'Remedial' | 'Menunggu Koreksi' = 'Remedial';
    if (percentage >= kkm) {
      status = 'Lulus';
    } else if (hasPendingEssays) {
      status = 'Menunggu Koreksi';
    }

    return {
      totalScore,
      maxScore,
      percentage,
      status,
      correctCount,
      totalQuestions: questions.length,
      hasPendingEssays,
      objectiveScore,
      objectiveMax,
      shortAnswerScore,
      shortAnswerMax,
      essayScore: 0,
      essayMax: 0,
      details,
    };
  }

  /**
   * Generate SHA-256 integrity seal for student submissions
   */
  static async generateSubmissionSeal(
    examId: string,
    nisn: string,
    answersPayload: string,
    violations: number
  ): Promise<string> {
    const raw = `EXAM:${examId}:NISN:${nisn}:VIOL:${violations}:DATA:${answersPayload}:KEY:UJIANPINTAR_SALT_2026`;
    const msgBuffer = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

export default RustEngineBridge;
