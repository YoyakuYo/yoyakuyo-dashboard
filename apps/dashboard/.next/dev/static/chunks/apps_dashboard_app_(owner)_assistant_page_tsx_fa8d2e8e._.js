(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/dashboard/app/(owner)/assistant/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// apps/dashboard/app/(owner)/assistant/page.tsx
// AI Assistant page for shop owners with customer message threads
__turbopack_context__.s([
    "default",
    ()=>AssistantPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/useAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/supabaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/dashboard/lib/apiClient.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function AssistantPage() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])();
    const [threads, setThreads] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedThreadId, setSelectedThreadId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loadingThreads, setLoadingThreads] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [ownerTakenOver, setOwnerTakenOver] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isTyping, setIsTyping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [translatingMessages, setTranslatingMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [ownerPreferredLanguage, setOwnerPreferredLanguage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('en');
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const subscriptionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const typingTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Auto-scroll to bottom when new messages arrive
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AssistantPage.useEffect": ()=>{
            messagesEndRef.current?.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }["AssistantPage.useEffect"], [
        messages
    ]);
    // Load threads and owner preferences on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AssistantPage.useEffect": ()=>{
            if (user?.id) {
                loadThreads();
                loadOwnerPreferences();
            }
        }
    }["AssistantPage.useEffect"], [
        user
    ]);
    const loadOwnerPreferences = async ()=>{
        try {
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/users/me`, {
                headers: {
                    'x-user-id': user?.id || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setOwnerPreferredLanguage(data.preferredLanguage || 'en');
            }
        } catch (error) {
            console.error('Error loading owner preferences:', error);
        }
    };
    // Load messages when thread is selected
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AssistantPage.useEffect": ()=>{
            if (selectedThreadId) {
                loadMessages(selectedThreadId);
                subscribeToMessages(selectedThreadId);
                markAsRead(selectedThreadId);
            }
            // Cleanup subscription on thread change
            return ({
                "AssistantPage.useEffect": ()=>{
                    if (subscriptionRef.current) {
                        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
                        supabase.removeChannel(subscriptionRef.current);
                    }
                }
            })["AssistantPage.useEffect"];
        }
    }["AssistantPage.useEffect"], [
        selectedThreadId
    ]);
    // Cleanup on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AssistantPage.useEffect": ()=>{
            return ({
                "AssistantPage.useEffect": ()=>{
                    if (subscriptionRef.current) {
                        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
                        supabase.removeChannel(subscriptionRef.current);
                    }
                }
            })["AssistantPage.useEffect"];
        }
    }["AssistantPage.useEffect"], []);
    const loadThreads = async ()=>{
        try {
            setLoadingThreads(true);
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/messages/owner/threads`, {
                headers: {
                    'x-user-id': user?.id || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setThreads(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to load threads');
                setThreads([]);
            }
        } catch (error) {
            console.error('Error loading threads:', error);
            setThreads([]);
        } finally{
            setLoadingThreads(false);
        }
    };
    const loadMessages = async (threadId)=>{
        try {
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/messages/thread/${threadId}`);
            if (res.ok) {
                const data = await res.json();
                const messagesData = Array.isArray(data) ? data : [];
                // Load takeover status
                const thread = threads.find((t)=>t.id === threadId);
                if (thread) {
                    setOwnerTakenOver(thread.ownerTakenOver || false);
                }
                // Translate customer/AI messages to owner's preferred language
                const translatedMessages = await Promise.all(messagesData.map(async (msg)=>{
                    if (msg.senderType === 'owner') {
                        // Owner messages: use originalContent if available
                        return {
                            ...msg,
                            originalContent: msg.originalContent || msg.content,
                            translatedContent: msg.content
                        };
                    } else if (msg.senderType === 'customer' || msg.senderType === 'ai') {
                        // Detect message language and translate to owner's preferred language if needed
                        // Simple heuristic to detect if message is already in owner's language
                        const needsTranslation = msg.content && !msg.translatedContent;
                        if (needsTranslation) {
                            try {
                                const translateRes = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/ai/translate`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        text: msg.content,
                                        targetLanguage: ownerPreferredLanguage,
                                        sourceLanguage: 'auto'
                                    })
                                });
                                if (translateRes.ok) {
                                    const translateData = await translateRes.json();
                                    return {
                                        ...msg,
                                        originalContent: msg.content,
                                        translatedContent: translateData.translatedText || msg.content,
                                        detectedLanguage: translateData.sourceLanguage
                                    };
                                }
                            } catch (translateError) {
                                console.error('Error translating message:', translateError);
                            }
                        }
                        return {
                            ...msg,
                            originalContent: msg.content,
                            translatedContent: msg.translatedContent || msg.content
                        };
                    }
                    return msg;
                }));
                setMessages(translatedMessages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };
    const toggleTakeover = async ()=>{
        if (!selectedThreadId) return;
        const newTakenOver = !ownerTakenOver;
        setOwnerTakenOver(newTakenOver);
        try {
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/messages/thread/${selectedThreadId}/takeover`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    takenOver: newTakenOver
                })
            });
            if (!res.ok) {
                // Revert on error
                setOwnerTakenOver(!newTakenOver);
                console.error('Failed to toggle takeover');
            } else {
                // Update thread in list
                setThreads((prev)=>prev.map((thread)=>thread.id === selectedThreadId ? {
                            ...thread,
                            ownerTakenOver: newTakenOver
                        } : thread));
            }
        } catch (error) {
            console.error('Error toggling takeover:', error);
            setOwnerTakenOver(!newTakenOver);
        }
    };
    const markAsRead = async (threadId)=>{
        try {
            await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/messages/thread/${threadId}/mark-read-owner`, {
                method: 'POST'
            });
            // Update local unread count
            setThreads((prev)=>prev.map((thread)=>thread.id === threadId ? {
                        ...thread,
                        unreadCount: 0
                    } : thread));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };
    const subscribeToMessages = (threadId)=>{
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
        const channel = supabase.channel(`shop_messages:thread_id=eq.${threadId}`).on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'shop_messages',
            filter: `thread_id=eq.${threadId}`
        }, async (payload)=>{
            const newMessage = payload.new;
            if (newMessage && newMessage.thread_id === threadId) {
                setMessages((prev)=>{
                    const exists = prev.some((msg)=>msg.id === newMessage.id);
                    if (exists) return prev;
                    // Translate customer/AI messages to English for owner
                    const messageData = {
                        id: newMessage.id,
                        senderType: newMessage.sender_type,
                        content: newMessage.content,
                        createdAt: newMessage.created_at,
                        readByOwner: newMessage.read_by_owner || false,
                        readByCustomer: newMessage.read_by_customer || false,
                        senderId: newMessage.sender_id || null,
                        originalContent: newMessage.content,
                        translatedContent: newMessage.content
                    };
                    // If customer/AI message, translate to owner's preferred language
                    if (newMessage.sender_type === 'customer' || newMessage.sender_type === 'ai') {
                        // Translate asynchronously
                        fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/ai/translate`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                text: newMessage.content,
                                targetLanguage: ownerPreferredLanguage,
                                sourceLanguage: 'auto'
                            })
                        }).then((res)=>res.json()).then((data)=>{
                            setMessages((prev)=>prev.map((msg)=>msg.id === newMessage.id ? {
                                        ...msg,
                                        translatedContent: data.translatedText || msg.content,
                                        detectedLanguage: data.sourceLanguage
                                    } : msg));
                        }).catch((err)=>console.error('Error translating new message:', err));
                    }
                    return [
                        ...prev,
                        messageData
                    ];
                });
                // Update thread last message
                setThreads((prev)=>prev.map((thread)=>thread.id === threadId ? {
                            ...thread,
                            lastMessageAt: newMessage.created_at,
                            lastMessagePreview: newMessage.content?.substring(0, 100) || null,
                            lastMessageFrom: newMessage.sender_type,
                            unreadCount: newMessage.sender_type === 'customer' && !newMessage.read_by_owner ? thread.unreadCount + 1 : thread.unreadCount
                        } : thread));
            }
        }).subscribe();
        subscriptionRef.current = channel;
    };
    // Handle typing indicator
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AssistantPage.useEffect": ()=>{
            if (input.trim() && selectedThreadId) {
                setIsTyping(true);
                // Clear existing timeout
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                // Set timeout to hide typing indicator after 2 seconds of no typing
                typingTimeoutRef.current = setTimeout({
                    "AssistantPage.useEffect": ()=>{
                        setIsTyping(false);
                    }
                }["AssistantPage.useEffect"], 2000);
            } else {
                setIsTyping(false);
            }
            return ({
                "AssistantPage.useEffect": ()=>{
                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                    }
                }
            })["AssistantPage.useEffect"];
        }
    }["AssistantPage.useEffect"], [
        input,
        selectedThreadId
    ]);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!input.trim() || loading || !selectedThreadId) {
            return;
        }
        setIsTyping(false);
        const messageContent = input.trim();
        setInput('');
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/messages/thread/${selectedThreadId}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senderType: 'owner',
                    senderId: user?.id || null,
                    content: messageContent
                })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(()=>({
                        error: 'Failed to send message'
                    }));
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }
            const sentMessage = await res.json();
            // Add message to local state (realtime will also add it, but this is immediate)
            setMessages((prev)=>{
                const exists = prev.some((msg)=>msg.id === sentMessage.id);
                if (exists) return prev;
                return [
                    ...prev,
                    sentMessage
                ];
            });
            // Update thread last message
            setThreads((prev)=>prev.map((thread)=>thread.id === selectedThreadId ? {
                        ...thread,
                        lastMessageAt: sentMessage.createdAt,
                        lastMessagePreview: sentMessage.content?.substring(0, 100) || null,
                        lastMessageFrom: 'owner'
                    } : thread));
            // Trigger AI response for owner messages (calendar commands, etc.)
            // Get shop ID from thread
            const currentThread = threads.find((t)=>t.id === selectedThreadId);
            if (currentThread?.shopId) {
                try {
                    await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$apiClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiUrl"]}/ai/chat-thread`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            threadId: selectedThreadId,
                            shopId: currentThread.shopId,
                            message: messageContent,
                            source: 'owner'
                        })
                    });
                } catch (aiError) {
                    // Silently handle AI errors - not critical for message sending
                    console.error('Error triggering AI response:', aiError);
                }
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err instanceof Error ? err.message : 'Failed to send message');
        } finally{
            setLoading(false);
            // Keep input focused after sending
            setTimeout(()=>{
                inputRef.current?.focus();
            }, 100);
        }
    };
    const formatTime = (dateString)=>{
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    };
    const formatDate = (dateString)=>{
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    };
    const selectedThread = threads.find((t)=>t.id === selectedThreadId);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8 bg-gray-50 min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold text-gray-800 mb-2",
                        children: t('assistant.title')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                        lineNumber: 476,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: t('assistant.subtitle')
                    }, void 0, false, {
                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                        lineNumber: 477,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                lineNumber: 475,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex h-[calc(100vh-280px)] min-h-[600px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-80 border-r border-gray-200 flex flex-col bg-gray-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "px-6 py-4 border-b border-gray-200 bg-white",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-lg font-semibold text-gray-800",
                                        children: t('assistant.customerConversations')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                        lineNumber: 485,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                    lineNumber: 484,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 overflow-y-auto bg-white",
                                    children: loadingThreads ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "p-6 text-center text-gray-500",
                                        children: t('assistant.loadingThreads')
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                        lineNumber: 490,
                                        columnNumber: 17
                                    }, this) : threads.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "p-6 text-center text-gray-500",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: t('assistant.noConversations')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                            lineNumber: 493,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                        lineNumber: 492,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "divide-y divide-gray-100",
                                        children: threads.map((thread)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setSelectedThreadId(thread.id),
                                                className: `w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${selectedThreadId === thread.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-start gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-lg",
                                                                children: "👤"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 507,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                            lineNumber: 506,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex-1 min-w-0",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center justify-between mb-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-sm font-semibold text-gray-900 truncate",
                                                                            children: thread.customerEmail || `Thread ${thread.id.substring(0, 8)}`
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                            lineNumber: 511,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        thread.unreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "ml-2 flex-shrink-0 bg-blue-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center",
                                                                            children: thread.unreadCount
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                            lineNumber: 515,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                    lineNumber: 510,
                                                                    columnNumber: 27
                                                                }, this),
                                                                thread.lastMessagePreview && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-gray-500 truncate mb-1",
                                                                    children: thread.lastMessagePreview
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                    lineNumber: 521,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-gray-400",
                                                                    children: formatDate(thread.lastMessageAt)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                    lineNumber: 525,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                            lineNumber: 509,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                    lineNumber: 505,
                                                    columnNumber: 23
                                                }, this)
                                            }, thread.id, false, {
                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                lineNumber: 498,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                        lineNumber: 496,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                    lineNumber: 488,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                            lineNumber: 483,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex flex-col bg-gray-50",
                            children: selectedThreadId ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-lg",
                                                            children: "👤"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                            lineNumber: 544,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                        lineNumber: 543,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                className: "text-lg font-semibold text-gray-800",
                                                                children: selectedThread?.customerEmail || `Thread ${selectedThreadId.substring(0, 8)}`
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 547,
                                                                columnNumber: 23
                                                            }, this),
                                                            selectedThread?.bookingId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-500",
                                                                children: [
                                                                    t('assistant.booking'),
                                                                    " ",
                                                                    selectedThread.bookingId.substring(0, 8)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 551,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                        lineNumber: 546,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                lineNumber: 542,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: toggleTakeover,
                                                className: `px-4 py-2 rounded-lg font-medium transition-colors ${ownerTakenOver ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`,
                                                children: ownerTakenOver ? t('assistant.youAreHandling') : t('assistant.letAiHandle')
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                lineNumber: 555,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                        lineNumber: 541,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50",
                                        children: messages.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-center h-full",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-6xl mb-4",
                                                        children: "💬"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                        lineNumber: 571,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "text-xl font-semibold text-gray-800 mb-2",
                                                        children: t('assistant.noMessages')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                        lineNumber: 572,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-gray-600",
                                                        children: t('assistant.startConversation')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                        lineNumber: 573,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                lineNumber: 570,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                            lineNumber: 569,
                                            columnNumber: 21
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                messages.map((message)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `flex gap-3 ${message.senderType === 'owner' ? 'justify-end' : 'justify-start'}`,
                                                        children: [
                                                            message.senderType !== 'owner' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-lg",
                                                                    children: message.senderType === 'ai' ? '🤖' : '👤'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                    lineNumber: 587,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 586,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: `max-w-[75%] rounded-lg px-4 py-3 shadow-sm ${message.senderType === 'owner' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "whitespace-pre-wrap break-words",
                                                                        children: message.senderType === 'owner' ? message.originalContent || message.content : message.translatedContent || message.content
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 599,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    (message.senderType === 'customer' || message.senderType === 'ai') && message.originalContent && message.originalContent !== message.translatedContent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-xs mt-1 opacity-75 italic",
                                                                        children: [
                                                                            "🇯🇵 ",
                                                                            message.originalContent.substring(0, 50),
                                                                            message.originalContent.length > 50 ? '...' : ''
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 608,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: `text-xs mt-2 ${message.senderType === 'owner' ? 'text-blue-100' : 'text-gray-500'}`,
                                                                        children: formatTime(message.createdAt)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 613,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 592,
                                                                columnNumber: 27
                                                            }, this),
                                                            message.senderType === 'owner' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-sm font-semibold text-gray-600",
                                                                    children: "You"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                    lineNumber: 623,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 622,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, message.id, true, {
                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                        lineNumber: 579,
                                                        columnNumber: 25
                                                    }, this)),
                                                isTyping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-3 justify-end",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-100 rounded-lg px-4 py-3",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 632,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce",
                                                                        style: {
                                                                            animationDelay: '0.2s'
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 633,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce",
                                                                        style: {
                                                                            animationDelay: '0.4s'
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 634,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs text-gray-500 ml-2",
                                                                        children: t('assistant.youAreTyping')
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 635,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 631,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                            lineNumber: 630,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-semibold text-gray-600",
                                                                children: "You"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 639,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                            lineNumber: 638,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                    lineNumber: 629,
                                                    columnNumber: 25
                                                }, this),
                                                loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-3 justify-start",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-lg",
                                                                children: "🤖"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 646,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                            lineNumber: 645,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-100 rounded-lg px-4 py-3",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 650,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce",
                                                                        style: {
                                                                            animationDelay: '0.2s'
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 651,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce",
                                                                        style: {
                                                                            animationDelay: '0.4s'
                                                                        }
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                        lineNumber: 652,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                                lineNumber: 649,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                            lineNumber: 648,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                    lineNumber: 644,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    ref: messagesEndRef
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                    lineNumber: 657,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                        lineNumber: 567,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0",
                                        children: [
                                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm",
                                                children: error
                                            }, void 0, false, {
                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                lineNumber: 664,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                                onSubmit: handleSubmit,
                                                className: "flex gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        ref: inputRef,
                                                        type: "text",
                                                        value: input,
                                                        onChange: (e)=>setInput(e.target.value),
                                                        placeholder: t('assistant.typeMessage'),
                                                        className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none",
                                                        disabled: loading,
                                                        autoFocus: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                        lineNumber: 669,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "submit",
                                                        disabled: !input.trim() || loading,
                                                        className: "px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                                                        children: loading ? t('assistant.sending') : t('assistant.send')
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                        lineNumber: 679,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                                lineNumber: 668,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                        lineNumber: 662,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-center h-full bg-gray-50",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-6xl mb-4",
                                            children: "💬"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                            lineNumber: 692,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-xl font-semibold text-gray-800 mb-2",
                                            children: t('assistant.selectConversation')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                            lineNumber: 693,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-600",
                                            children: t('assistant.selectConversationDesc')
                                        }, void 0, false, {
                                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                            lineNumber: 694,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                    lineNumber: 691,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                                lineNumber: 690,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                            lineNumber: 538,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                    lineNumber: 481,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
                lineNumber: 480,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/dashboard/app/(owner)/assistant/page.tsx",
        lineNumber: 474,
        columnNumber: 5
    }, this);
}
_s(AssistantPage, "B+H5cwlPrGOiPacoKIycW/gP8u0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$dashboard$2f$lib$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"]
    ];
});
_c = AssistantPage;
var _c;
__turbopack_context__.k.register(_c, "AssistantPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_dashboard_app_%28owner%29_assistant_page_tsx_fa8d2e8e._.js.map