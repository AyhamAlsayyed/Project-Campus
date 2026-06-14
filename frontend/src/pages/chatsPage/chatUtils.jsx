import API from '../../config';

export { API };

export const normalizeMessages = (data) =>
    (Array.isArray(data) ? data : []).map(msg => ({
        ...msg,
        text: msg.content || msg.text,
        senderId: msg.sender?.id || msg.senderId,
        sender: msg.sender?.username || msg.sender,
        avatar: msg.sender?.avatar || msg.avatar,
        time: msg.sent_at
            ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : msg.time,
        date: msg.sent_at || msg.date,
        reply_to_details: msg.parent_message || msg.reply_to_details,
        post: msg.shared_post || msg.post || null, 
    }));

export const getSenderName = (sender) => {
    if (!sender) return '';
    if (typeof sender === 'string') return sender;
    if (typeof sender === 'object') return sender.username || sender.name || '';
    return '';
};

export function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} min ago`; }
    if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h}h ago`; }
    if (diff < 604800) { const d = Math.floor(diff / 86400); return `${d} day${d > 1 ? 's' : ''} ago`; }
    if (diff < 2592000) { const w = Math.floor(diff / 604800); return `${w} week${w > 1 ? 's' : ''} ago`; }
    const mo = Math.floor(diff / 2592000);
    return `${mo} month${mo > 1 ? 's' : ''} ago`;
}