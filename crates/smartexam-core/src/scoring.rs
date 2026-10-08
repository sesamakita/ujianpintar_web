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
    pub status: String, // "Lulus", "Remedial", or "Menunggu Koreksi"
    pub correct_count: u32,
    pub total_questions: u32,
}

pub struct ScoringEngine;

impl ScoringEngine {
    /// Calculate final grade from questions and student answers
    /// Mirrors the TypeScript mirrors (web rustEngine.ts & mobile scoringEngine.ts)
    pub fn grade_exam(
        questions: &[QuestionItem],
        answers: &[StudentAnswerItem],
        kkm_score: u32,
    ) -> GradeResult {
        let mut total_score: u32 = 0;
        let mut max_score: u32 = 0;
        let mut correct_count: u32 = 0;
        let mut has_pending_essays: bool = false;

        for q in questions {
            max_score += q.points;
            let student_ans = answers.iter().find(|a| a.question_id == q.id);

            if q.question_type == "essay" {
                // Essay answers require teacher / AI grading, initially 0 points pending
                has_pending_essays = true;
                continue;
            }

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
        } else if has_pending_essays {
            "Menunggu Koreksi".to_string()
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

#[cfg(test)]
mod tests {
    use super::*;

    fn q(id: &str, q_type: &str, correct_id: Option<&str>, points: u32) -> QuestionItem {
        QuestionItem {
            id: id.to_string(),
            question_type: q_type.to_string(),
            correct_option_id: correct_id.map(|s| s.to_string()),
            correct_answer_text: None,
            points,
        }
    }

    fn a(question_id: &str, selected: Option<&str>) -> StudentAnswerItem {
        StudentAnswerItem {
            question_id: question_id.to_string(),
            selected_option_id: selected.map(|s| s.to_string()),
            answer_text: None,
        }
    }

    #[test]
    fn lulus_when_percentage_meets_kkm() {
        let questions = vec![q("q1", "multiple_choice", Some("A"), 10)];
        let answers = vec![a("q1", Some("A"))];
        let res = ScoringEngine::grade_exam(&questions, &answers, 75);
        assert_eq!(res.status, "Lulus");
        assert_eq!(res.total_score, 10);
        assert_eq!(res.percentage, 100.0);
    }

    #[test]
    fn remedial_when_below_kkm_without_essay() {
        let questions = vec![q("q1", "multiple_choice", Some("B"), 10)];
        let answers = vec![a("q1", Some("A"))];
        let res = ScoringEngine::grade_exam(&questions, &answers, 75);
        assert_eq!(res.status, "Remedial");
        assert_eq!(res.total_score, 0);
    }

    #[test]
    fn pending_essay_when_below_kkm_with_essay() {
        let questions = vec![
            q("q1", "multiple_choice", Some("B"), 10),
            q("q2", "essay", None, 10),
        ];
        let answers = vec![a("q1", Some("A"))];
        let res = ScoringEngine::grade_exam(&questions, &answers, 75);
        assert_eq!(res.status, "Menunggu Koreksi");
        assert_eq!(res.total_score, 0);
        // Essay contributes to max score but never to correct count
        assert_eq!(res.max_score, 20);
        assert_eq!(res.correct_count, 0);
    }

    #[test]
    fn lulus_even_with_essay_when_passing() {
        let questions = vec![
            q("q1", "multiple_choice", Some("A"), 10),
            q("q2", "essay", None, 2),
        ];
        let answers = vec![a("q1", Some("A"))];
        let res = ScoringEngine::grade_exam(&questions, &answers, 75);
        assert_eq!(res.status, "Lulus");
        assert_eq!(res.total_score, 10);
        assert_eq!(res.max_score, 12);
    }

    #[test]
    fn essay_never_counts_as_correct() {
        let questions = vec![q("q1", "essay", None, 10)];
        let answers = vec![a("q1", Some("whatever"))];
        let res = ScoringEngine::grade_exam(&questions, &answers, 75);
        assert_eq!(res.total_score, 0);
        assert_eq!(res.correct_count, 0);
        assert_eq!(res.status, "Menunggu Koreksi");
    }
}
