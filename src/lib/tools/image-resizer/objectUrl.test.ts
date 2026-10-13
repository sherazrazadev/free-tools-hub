import { afterEach, describe, expect, it, vi } from 'vitest';
import { createManagedObjectUrl, revokeObjectUrl } from './objectUrl';

describe('objectUrl helpers', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('createManagedObjectUrl creates and revokes once', () => {
		const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-1');
		const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

		const managed = createManagedObjectUrl(new Blob(['x'], { type: 'image/png' }));
		expect(create).toHaveBeenCalledOnce();
		expect(managed.url).toBe('blob:mock-1');

		managed.revoke();
		managed.revoke();
		expect(revoke).toHaveBeenCalledTimes(1);
		expect(revoke).toHaveBeenCalledWith('blob:mock-1');
	});

	it('revokeObjectUrl no-ops on null', () => {
		const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
		revokeObjectUrl(null);
		revokeObjectUrl(undefined);
		expect(revoke).not.toHaveBeenCalled();
		revokeObjectUrl('blob:x');
		expect(revoke).toHaveBeenCalledWith('blob:x');
	});
});
