import { useId, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import '../../styles/islands/FileDropzone.css';

export type FileDropzoneProps = {
	label: string;
	accept: string;
	hint?: string;
	multiple?: boolean;
	disabled?: boolean;
	/** Shown under the CTA when a file is already chosen */
	fileLabel?: string | null;
	inputRef?: RefObject<HTMLInputElement | null>;
	onFiles: (files: FileList | null) => void;
	id?: string;
};

/**
 * Click / drag-drop file picker with a clear cloud-upload affordance.
 */
export default function FileDropzone({
	label,
	accept,
	hint,
	multiple = false,
	disabled = false,
	fileLabel = null,
	inputRef,
	onFiles,
	id,
}: FileDropzoneProps) {
	const autoId = useId();
	const inputId = id ?? `${autoId}-file`;
	const localRef = useRef<HTMLInputElement>(null);
	const resolvedRef = inputRef ?? localRef;
	const [dragging, setDragging] = useState(false);

	function openPicker() {
		if (disabled) return;
		resolvedRef.current?.click();
	}

	function onChange(e: ChangeEvent<HTMLInputElement>) {
		onFiles(e.target.files);
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		if (!disabled) setDragging(true);
	}

	function onDragLeave(e: DragEvent) {
		e.preventDefault();
		setDragging(false);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		setDragging(false);
		if (disabled) return;
		onFiles(e.dataTransfer.files);
	}

	return (
		<div className="file-drop">
			<span className="file-drop__label" id={`${inputId}-label`}>
				{label}
			</span>
			<button
				type="button"
				className={`file-drop__zone${dragging ? ' is-dragging' : ''}${disabled ? ' is-disabled' : ''}`}
				onClick={openPicker}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				disabled={disabled}
				aria-describedby={hint ? `${inputId}-hint` : undefined}
				aria-labelledby={`${inputId}-label`}
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
				<span className="file-drop__cta">
					<strong>Click to upload</strong>
					<span className="file-drop__or"> or drag and drop</span>
				</span>
				{fileLabel ? <span className="file-drop__chosen">{fileLabel}</span> : null}
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
			/>
			{hint ? (
				<p id={`${inputId}-hint`} className="file-drop__hint">
					{hint}
				</p>
			) : null}
		</div>
	);
}
