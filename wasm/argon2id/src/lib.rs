use wasm_bindgen::prelude::*;

use argon2::{Algorithm, Argon2, Params, Version};

#[wasm_bindgen]
pub fn hash(
  password: &str,
  salt: &[u8],
  output_length: usize,
  memory_cost: u32,
  time_cost: u32,
) -> Result<Vec<u8>, JsValue> {
  let threads = 1;

  let params =
    Params::new(memory_cost, time_cost, threads, Some(output_length)).map_err(|e| e.to_string())?;
  let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

  let mut out = vec![0; output_length];
  argon2
    .hash_password_into(password.as_bytes(), salt, &mut out[..])
    .map_err(|e| e.to_string())?;
  Ok(out)
}
