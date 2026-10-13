import { describe, expect, it } from 'vitest';
import { moveItem, removeAtIndex } from './order';

describe('moveItem', () => {
	it('moves forward', () => {
		expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
	});

	it('moves backward', () => {
		expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
	});

	it('no-ops for same index', () => {
		expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
	});
});

describe('removeAtIndex', () => {
	it('removes one item', () => {
		expect(removeAtIndex(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
	});

	it('ignores out of range', () => {
		expect(removeAtIndex(['a'], 3)).toEqual(['a']);
	});
});
