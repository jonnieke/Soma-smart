import { useEffect, useRef, useState } from 'react';

// A draft can arrive after authentication or an asynchronous storage read.
export function useTeacherDraftContent(incomingContent?: string) {
    const [content, setContent] = useState(incomingContent || '');
    const restored = useRef(incomingContent || '');
    useEffect(() => {
        if (!incomingContent || restored.current === incomingContent) return;
        restored.current = incomingContent;
        setContent(incomingContent);
    }, [incomingContent]);
    return [content, setContent] as const;
}
