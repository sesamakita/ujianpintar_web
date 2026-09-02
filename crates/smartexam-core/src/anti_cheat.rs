use sha2::{Digest, Sha256};

pub struct AntiCheatEngine;

impl AntiCheatEngine {
    /// Generate a tamper-proof SHA-256 seal for student exam submissions
    pub fn generate_submission_seal(
        exam_id: &str,
        nisn: &str,
        answers_payload: &str,
        violation_count: u32,
        secret_key: &str,
    ) -> String {
        let mut hasher = Sha256::new();
        let payload = format!(
            "EXAM:{}:NISN:{}:VIOL:{}:DATA:{}:KEY:{}",
            exam_id, nisn, violation_count, answers_payload, secret_key
        );
        hasher.update(payload.as_bytes());
        let result = hasher.finalize();
        format!("{:x}", result)
    }

    /// Verify if a submission seal matches the computed hash
    pub fn verify_seal(
        exam_id: &str,
        nisn: &str,
        answers_payload: &str,
        violation_count: u32,
        secret_key: &str,
        provided_seal: &str,
    ) -> bool {
        let expected = Self::generate_submission_seal(
            exam_id,
            nisn,
            answers_payload,
            violation_count,
            secret_key,
        );
        expected == provided_seal
    }
}
