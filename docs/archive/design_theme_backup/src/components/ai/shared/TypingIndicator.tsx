import { motion } from 'framer-motion';

export function TypingIndicator() {
    return (
        <div className="flex gap-1 p-2 bg-slate-100 rounded-2xl w-fit ml-4 mb-2">
            <motion.div
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
            />
            <motion.div
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
            />
            <motion.div
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
            />
        </div>
    );
}
