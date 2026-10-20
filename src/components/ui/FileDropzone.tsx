import { useId, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import '../../styles/islands/FileDropzone.css';

export type FileDropzoneProps = {
	label: string;
	accept: string;
	hint?: string;
	multiple?: boolean;
	disabled?: boolean;
	/** Name of the chosen file (or "3 files selected"). Shows the file chip. */
	fileLabel?: string | null;
	/** Secondary chip text, e.g. "1.2 MB" or "800×600". */
	fileMeta?: string | null;
	/** When set, the chip shows a Remove button. */
	onClear?: () => void;
	/** Inline file problem (wrong type, too large, unreadable). Announced to AT. */
	error?: string | null;
	inputRef?: RefObject<HTMLInputElement | null>;
	onFiles: (files: FileList | null) => void;
	id?: string;
};

/**
 * Click / drag-drop file picker.
 * States: default, hover, drag-over, focus, disabled, filled (chip + remove), error.
 * Shared by every image and PDF tool - never fall back to a bare native "Choose file".
 */
export default function FileDropzone({
	label,
	accept,
	hint,
	multiple = false,
	disabled = false,
	fileLabel = null,
	fileMeta = null,
	onClear,
	error = null,
	inputRef,
	onFiles,
	id,
}: FileDropzoneProps) {
	const autoId = useId();
	const inputId = id ?? `${autoId}-file`;
	const localRef = useRef<HTMLInputElement>(null);
	const resolvedRef = inputRef ?? localRef;
	const [dragging, setDragging] = useState(false);

	const filled = Boolean(fileLabel);
	const hintId = `${inputId}-hint`;
	const errorId = `${inputId}-error`;
	const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

	function openPicker() {
		if (disabled) return;
		resolvedRef.current?.click();
	}

	function onChange(e: ChangeEvent<HTMLInputElement>) {
		const input = e.target;
		const live = input.files;
		// Snapshot the selection, then reset the input so the same file can be
		// chosen again after Remove (a live FileList empties on reset).
		let snapshot: FileList | null = null;
		if (live && live.length > 0 && typeof DataTransfer !== 'undefined') {
			try {
				const dt = new DataTransfer();
				for (const file of Array.from(live)) dt.items.add(file);
				snapshot = dt.files;
			} catch {
				snapshot = null;
			}
		}
		if (snapshot) {
			onFiles(snapshot);
			input.value = '';
		} else {
			onFiles(live);
		}
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		if (!disabled) setDragging(true);
	}

	function onDragLeave(e: DragEvent) {
		e.preventDefault();
		// Ignore leave events fired when moving between the zone's own children.
		if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
		setDragging(false);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		setDragging(false);
		if (disabled) return;
		onFiles(e.dataTransfer.files);
	}

	const zoneClass = [
		'file-drop__zone',
		dragging ? 'is-dragging' : '',
		disabled ? 'is-disabled' : '',
		filled ? 'is-filled' : '',
		error ? 'has-error' : '',
	]
		.filter(Boolean)
		.join(' ');

	let ctaStrong = 'Click to upload';
	let ctaRest = ' or drag and drop';
	if (dragging) {
		ctaStrong = multiple ? 'Drop files here' : 'Drop file here';
		ctaRest = '';
	} else if (filled) {
		ctaStrong = multiple ? 'Add more files' : 'Replace file';
		ctaRest = ' or drag and drop';
	}

	return (
		<div className="file-drop">
			<span className="file-drop__label" id={`${inputId}-label`}>
				{label}
			</span>
			<button
				type="button"
				className={zoneClass}
				onClick={openPicker}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				disabled={disabled}
				aria-describedby={describedBy || undefined}
				aria-labelledby={`${inputId}-label ${inputId}-cta`}
			>
				<span className="file-drop__icon" aria-hidden="true">
					<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
						<path
							d="M32.5 30.5c3.6-.2 6.5-3.2 6.5-6.9 0-3.5-2.6-6.4-6-6.9C31.8 12.2 27.8 9 23 9c-5.3 0-9.7 3.7-10.7 8.7A7.5 7.5 0 0 0 8 25.2c0 4.1 3.3 7.4 7.4 7.4H18"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M24 38V22m0 0 5.5 5.5M24 22l-5.5 5.5"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
				<span className="file-drop__cta" id={`${inputId}-cta`}>
					<strong>{ctaStrong}</strong>
					{ctaRest ? <span className="file-drop__or">{ctaRest}</span> : null}
				</span>
			</button>
			<input
				ref={resolvedRef}
				id={inputId}
				className="file-drop__input"
				type="file"
				accept={accept}
				multiple={multiple}
				disabled={disabled}
				onChange={onChange}
				tabIndex={-1}
				aria-labelledby={`${inputId}-label`}
			/>

			<div className="file-drop__status" aria-live="polite">
				{filled ? (
					<div className="file-drop__chip" role="group" aria-label="Selected file">
						<svg className="file-drop__chip-icon" viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
							<path
								d="M6 2.5h5.5L15.5 6.5V16a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 16V4A1.5 1.5 0 0 1 6 2.5Z"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinejoin="round"
							/>
							<path d="M11.5 2.5V6.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
						</svg>
						<span className="file-drop__chip-text">
							<span className="file-drop__chip-name" title={fileLabel ?? undefined}>
								{fileLabel}
							</span>
							{fileMeta ? <span className="file-drop__chip-meta">{fileMeta}</span> : null}
						</span>
						{onClear ? (
							<button
								type="button"
								className="file-drop__chip-clear"
								onClick={onClear}
								disabled={disabled}
								aria-label={`Remove ${fileLabel}`}
							>
								<svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
									<path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
								</svg>
								<span className="file-drop__chip-clear-text">Remove</span>
							</button>
						) : null}
					</div>
				) : null}
			</div>

			{error ? (
				<p id={errorId} className="file-drop__error" role="alert">
					<svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
						<circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
						<path d="M10 5.8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
						<circle cx="10" cy="13.9" r="1" fill="currentColor" />
					</svg>
					<span>{error}</span>
				</p>
			) : null}

			{hint ? (
				<p id={hintId} className="file-drop__hint">
					{hint}
				</p>
			) : null}
		</div>
	);
}
