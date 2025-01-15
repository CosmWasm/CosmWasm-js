/* tslint:disable */
/* eslint-disable */
/**
 * @param {string} password
 * @param {Uint8Array} salt
 * @param {number} output_length
 * @param {number} memory_cost
 * @param {number} time_cost
 * @returns {Uint8Array}
 */
export function hash(
  password: string,
  salt: Uint8Array,
  output_length: number,
  memory_cost: number,
  time_cost: number,
): Uint8Array;
