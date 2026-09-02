use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuestionItem {
    pub id: String,
    pub question_type: String, // "multiple_choice", "short_answer", "true_false", "essay"
    pub correct_option_id: Option<String>,
    pub correct_answer_text: Option<String>,
    pub points: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StudentAnswerItem {
    pub question_id: String,
    pub selected_option_id: Option<String>,
    pub answer_text: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GradeResult {
    pub total_score: u32,
    pub max_score: u32,
    pub percentage: f64,
    pub status: String, // "Lulus" or "Remedial"
    pub correct_count: u32,
    pub total_questions: u32,
}

pub struct ScoringEngine;

impl ScoringEngine {
    /// Calculate final grade from questions and student answers
    pub fn grade_exam(
        questions: &[QuestionItem],
        answers: &[StudentAnswerItem],
        kkm_score: u32,
    ) -> GradeResult {
        let mut total_score: u32 = 0;
        let mut max_score: u32 = 0;
        let mut correct_count: u32 = 0;

        for q in questions {
            max_score += q.points;
            let student_ans = answers.iter().find(|a| a.question_id == q.id);

            if let Some(ans) = student_ans {
                let is_correct = match q.question_type.as_str() {
                    "multiple_choice" | "true_false" => {
                        q.correct_option_id.is_some()
                            && ans.selected_option_id == q.correct_option_id
                    }
                    "short_answer" => {
                        if let (Some(correct_txt), Some(user_txt)) =
                            (&q.correct_answer_text, &ans.answer_text)
                        {
                            Self::fuzzy_match_answer(correct_txt, user_txt)
                        } else {
                            false
                        }
                    }
                    _ => false,
                };

                if is_correct {
                    total_score += q.points;
                    correct_count += 1;
                }
            }
        }

        let percentage = if max_score > 0 {
            ((total_score as f64) / (max_score as f64)) * 100.0
        } else {
            0.0
        };

        let status = if percentage >= (kkm_score as f64) {
            "Lulus".to_string()
        } else {
            "Remedial".to_string()
        };

        GradeResult {
            total_score,
            max_score,
            percentage,
            status,
            correct_count,
            total_questions: questions.len() as u32,
        }
    }

    /// Normalized case-insensitive and whitespace-trimmed answer comparison
    fn fuzzy_match_answer(correct: &str, user: &str) -> bool {
        let clean_c = correct.trim().to_lowercase().replace(',', ".");
        let clean_u = user.trim().to_lowercase().replace(',', ".");
        clean_c == clean_u
    }
}
