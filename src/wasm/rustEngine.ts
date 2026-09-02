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
  total_score: number;
  max_score: number;
  percentage: number;
  status: 'Lulus' | 'Remedial';
  correct_count: number;
  total_questions: number;
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

    for (const q of questions) {
      maxScore += q.points || 10;
      const ans = answers.find((a) => a.question_id === q.id);

      if (ans) {
        let isCorrect = false;

        if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
          isCorrect = !!q.correct_option_id && ans.selected_option_id === q.correct_option_id;
        } else if (q.question_type === 'short_answer') {
          if (q.correct_answer_text && ans.answer_text) {
            const cleanC = q.correct_answer_text.trim().toLowerCase().replace(/,/g, '.');
            const cleanU = ans.answer_text.trim().toLowerCase().replace(/,/g, '.');
            isCorrect = cleanC === cleanU;
          }
        }

        if (isCorrect) {
          totalScore += q.points || 10;
          correctCount++;
        }
      }
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const status: 'Lulus' | 'Remedial' = percentage >= kkm ? 'Lulus' : 'Remedial';

    return {
      total_score: totalScore,
      max_score: maxScore,
      percentage,
      status,
      correct_count: correctCount,
      total_questions: questions.length,
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
