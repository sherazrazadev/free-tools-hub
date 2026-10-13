import { useEffect } from 'react';
import { trackToolComplete, trackToolExport, trackToolStart } from './track';

/**
 * React island helper: `tool_start` once on mount; callers fire complete/export.
 */
export function useToolAnalytics(toolId: string) {
	useEffect(() => {
		trackToolStart(toolId);
	}, [toolId]);

	return {
		toolComplete: () => trackToolComplete(toolId),
		toolExport: () => trackToolExport(toolId),
	};
}
