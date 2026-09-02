pub mod anti_cheat;
pub mod scoring;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn grade_exam_wasm(
    questions_json: &str,
    answers_json: &str,
    kkm: u32,
) -> Result<String, JsValue> {
    let questions: Vec<scoring::QuestionItem> = serde_json::from_str(questions_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid questions JSON: {}", e)))?;

    let answers: Vec<scoring::StudentAnswerItem> = serde_json::from_str(answers_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid answers JSON: {}", e)))?;

    let result = scoring::ScoringEngine::grade_exam(&questions, &answers, kkm);
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn generate_integrity_seal(
    exam_id: &str,
    nisn: &str,
    answers_json: &str,
    violations: u32,
) -> String {
    anti_cheat::AntiCheatEngine::generate_submission_seal(
        exam_id,
        nisn,
        answers_json,
        violations,
        "UJIANPINTAR_SALT_2026",
    )
}
