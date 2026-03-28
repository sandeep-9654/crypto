import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import useQuestionManager from '../../hooks/useQuestionManager';
import useQmgrSession from '../../hooks/useQmgrSession';
import GlitchText from '../../components/GlitchText';
import TerminalCard from '../../components/TerminalCard';
import CipherBadge from '../../components/CipherBadge';

const CIPHER_TYPES = ['CCS', 'VIG', 'AC', 'PLF', 'PCS', 'MORSE', 'CODE', 'RFC'];

const SystemConsole = () => {
    useQmgrSession();
    const {
        questions, rounds, fetchQuestions, fetchRounds,
        createQuestion, updateQuestion, deleteQuestion, reorderQuestions,
        liveSwap, bulkImport, previewQuestion, getAuditLog, uploadImage
    } = useQuestionManager();

    const [activeRound, setActiveRound] = useState(1);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [editorMode, setEditorMode] = useState(null); // 'create' | 'edit'
    const [previewData, setPreviewData] = useState(null);
    const [showBulk, setShowBulk] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [liveSwapConfirm, setLiveSwapConfirm] = useState(null);
    const [sessionTime, setSessionTime] = useState(7200);
    const [filterType, setFilterType] = useState('ALL');

    // Form state
    const [form, setForm] = useState({
        questionNumber: 1, displayOrder: 1, cipherType: 'CCS', cipherLabel: '',
        encryptedText: '', codeSnippet: '', imageUrl: '', correctAnswer: '',
        hintLetter: '', hint: '', points: 10
    });

    useEffect(() => { fetchRounds(); }, [fetchRounds]);
    useEffect(() => { fetchQuestions({ roundNumber: activeRound }); }, [activeRound, fetchQuestions]);

    // Session timer
    useEffect(() => {
        const i = setInterval(() => setSessionTime(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(i);
    }, []);

    const filteredQuestions = filterType === 'ALL'
        ? questions : questions.filter(q => q.cipherType === filterType);

    const handleDragEnd = useCallback(async (result) => {
        if (!result.destination) return;
        const items = Array.from(filteredQuestions);
        const [reordered] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reordered);
        const orderedIds = items.map(q => q._id);
        await reorderQuestions(activeRound, orderedIds);
        fetchQuestions({ roundNumber: activeRound });
    }, [filteredQuestions, activeRound, reorderQuestions, fetchQuestions]);

    const handleSave = async () => {
        try {
            if (editorMode === 'create') {
                await createQuestion({ ...form, roundNumber: activeRound });
            } else if (editorMode === 'edit' && selectedQuestion) {
                await updateQuestion(selectedQuestion._id, form);
            }
            fetchQuestions({ roundNumber: activeRound });
            setEditorMode(null);
            setSelectedQuestion(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving question');
        }
    };

    const handleLiveSwap = async (notifyTeams) => {
        try {
            await liveSwap(liveSwapConfirm._id, form, notifyTeams);
            setLiveSwapConfirm(null);
            fetchQuestions({ roundNumber: activeRound });
        } catch (err) {
            alert(err.response?.data?.error || 'Live swap failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await deleteQuestion(id);
            fetchQuestions({ roundNumber: activeRound });
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.error || 'Delete failed');
        }
    };

    const handlePreview = async (id) => {
        const data = await previewQuestion(id);
        setPreviewData(data);
    };

    const startEdit = (q) => {
        setSelectedQuestion(q);
        setForm({
            questionNumber: q.questionNumber, displayOrder: q.displayOrder,
            cipherType: q.cipherType, cipherLabel: q.cipherLabel || '',
            encryptedText: q.encryptedText || '', codeSnippet: q.codeSnippet || '',
            imageUrl: q.imageUrl || '', correctAnswer: q.correctAnswer || '',
            hintLetter: q.hintLetter || '', hint: q.hint || '', points: q.points
        });
        setEditorMode('edit');
    };

    const startCreate = () => {
        const maxOrder = questions.reduce((m, q) => Math.max(m, q.displayOrder || 0), 0);
        setForm({
            questionNumber: maxOrder + 1, displayOrder: maxOrder + 1,
            cipherType: 'CCS', cipherLabel: '', encryptedText: '', codeSnippet: '',
            imageUrl: '', correctAnswer: '', hintLetter: '', hint: '', points: 10
        });
        setEditorMode('create');
        setSelectedQuestion(null);
    };

    const handleBulkImport = async (jsonText) => {
        try {
            const data = JSON.parse(jsonText);
            const result = await bulkImport(data);
            alert(`Imported: ${result.imported.rounds} rounds, ${result.imported.questions} questions`);
            setShowBulk(false);
            fetchRounds();
            fetchQuestions({ roundNumber: activeRound });
        } catch (err) {
            alert(err.response?.data?.error || 'Import failed');
        }
    };

    const sessionMinutes = Math.floor(sessionTime / 60);
    const sessionSeconds = sessionTime % 60;

    return (
        <div className="min-h-screen bg-hacker-black p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-terminal-border pb-3">
                <div className="flex items-center gap-4">
                    <GlitchText text="QM CONSOLE" tag="h1" className="text-xl text-neon-green" />
                    <span className="text-xs text-neon-green border border-neon-green px-2 py-1">Dual Auth: ✓ VERIFIED</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`text-xs ${sessionTime < 600 ? 'text-danger-red' : 'text-electric-cyan'}`}>
                        SESSION: {String(sessionMinutes).padStart(2, '0')}:{String(sessionSeconds).padStart(2, '0')}
                    </span>
                    <button onClick={() => setShowAudit(true)} className="btn-cyan text-xs">AUDIT_LOG</button>
                    <Link to="/admin/dashboard" className="btn-danger text-xs no-underline">LOGOUT</Link>
                </div>
            </div>

            {/* Round Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
                {rounds.map(r => (
                    <button key={r.roundNumber} onClick={() => setActiveRound(r.roundNumber)}
                        className={`px-4 py-2 text-xs border whitespace-nowrap ${activeRound === r.roundNumber
                            ? 'border-neon-green text-neon-green bg-neon-green/10'
                            : 'border-terminal-border text-neon-green/50'}`}>
                        ROUND {r.roundNumber} — {r.roundName} ({r.questionCount || 0} Qs)
                    </button>
                ))}
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 160px)' }}>
                {/* LEFT: Question List (30%) */}
                <div className="col-span-12 lg:col-span-4 overflow-y-auto">
                    <TerminalCard title="[QUESTION LIST]">
                        <div className="space-y-2 mb-3">
                            <select value={filterType} onChange={e => setFilterType(e.target.value)}
                                className="terminal-input text-xs bg-terminal-dark w-full">
                                <option value="ALL">ALL TYPES</option>
                                {CIPHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="questions">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                        {filteredQuestions.map((q, index) => (
                                            <Draggable key={q._id} draggableId={q._id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                        className={`border border-terminal-border rounded p-3 text-xs cursor-pointer
                              ${snapshot.isDragging ? 'border-neon-green bg-neon-green/10' : ''}
                              ${selectedQuestion?._id === q._id ? 'border-electric-cyan' : ''}`}>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-neon-green opacity-50">≡</span>
                                                                <span className="text-neon-green">Q{q.displayOrder}</span>
                                                                <CipherBadge type={q.cipherType} />
                                                            </div>
                                                            <span className="text-warning-yellow">{q.points}pts</span>
                                                        </div>
                                                        <p className="text-neon-green opacity-60 truncate mt-1">
                                                            {q.encryptedText || q.codeSnippet || (q.imageUrl ? '[Image]' : '')}
                                                        </p>
                                                        <div className="flex gap-2 mt-2">
                                                            <button onClick={() => startEdit(q)} className="text-electric-cyan hover:underline">Edit</button>
                                                            <button onClick={() => handlePreview(q._id)} className="text-neon-green hover:underline">Preview</button>
                                                            <button onClick={() => handleDelete(q._id)} className="text-danger-red hover:underline">Delete</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        <div className="flex gap-2 mt-4">
                            <button onClick={startCreate} className="btn-primary text-xs flex-1">ADD_QUESTION</button>
                            <button onClick={() => setShowBulk(true)} className="btn-cyan text-xs">BULK_IMPORT</button>
                        </div>
                    </TerminalCard>
                </div>

                {/* CENTER: Question Editor (45%) */}
                <div className="col-span-12 lg:col-span-5 overflow-y-auto">
                    <TerminalCard title={editorMode === 'create' ? '[CREATE QUESTION]' : editorMode === 'edit' ? '[EDIT QUESTION]' : '[SELECT A QUESTION]'}>
                        {editorMode ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-electric-cyan text-xs block mb-1">Question #</label>
                                        <input type="number" value={form.questionNumber} onChange={e => setForm({ ...form, questionNumber: Number(e.target.value) })}
                                            className="terminal-input text-xs" />
                                    </div>
                                    <div>
                                        <label className="text-electric-cyan text-xs block mb-1">Display Order</label>
                                        <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })}
                                            className="terminal-input text-xs" />
                                    </div>
                                    <div>
                                        <label className="text-electric-cyan text-xs block mb-1">Points</label>
                                        <input type="number" value={form.points} onChange={e => setForm({ ...form, points: Number(e.target.value) })}
                                            className="terminal-input text-xs" min="1" max="100" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-electric-cyan text-xs block mb-1">Cipher Type</label>
                                        <select value={form.cipherType} onChange={e => setForm({ ...form, cipherType: e.target.value })}
                                            className="terminal-input text-xs bg-terminal-dark">
                                            {CIPHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-electric-cyan text-xs block mb-1">Cipher Label</label>
                                        <input type="text" value={form.cipherLabel} onChange={e => setForm({ ...form, cipherLabel: e.target.value })}
                                            className="terminal-input text-xs" placeholder="e.g. CCS13" />
                                    </div>
                                </div>

                                {['CCS', 'VIG', 'AC', 'PLF', 'PCS', 'MORSE', 'RFC'].includes(form.cipherType) && (
                                    <div>
                                        <label className="text-electric-cyan text-xs block mb-1">Encrypted Text</label>
                                        <textarea value={form.encryptedText} onChange={e => setForm({ ...form, encryptedText: e.target.value })}
                                            className="terminal-input text-xs h-24 resize-none" placeholder="Enter encrypted text..." />
                                    </div>
                                )}

                                {form.cipherType === 'CODE' && (
                                    <div>
                                        <label className="text-electric-cyan text-xs block mb-1">Code Snippet</label>
                                        <textarea value={form.codeSnippet} onChange={e => setForm({ ...form, codeSnippet: e.target.value })}
                                            className="terminal-input text-xs h-32 resize-none font-mono" placeholder="Enter C code..." />
                                    </div>
                                )}



                                <div>
                                    <label className="text-electric-cyan text-xs block mb-1">🔒 CORRECT ANSWER</label>
                                    <input type="text" value={form.correctAnswer} onChange={e => setForm({ ...form, correctAnswer: e.target.value })}
                                        className="terminal-input text-xs border-danger-red" placeholder="Enter correct answer"
                                        onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-electric-cyan text-xs block mb-1">Hint Letter</label>
                                        <input type="text" value={form.hintLetter} onChange={e => setForm({ ...form, hintLetter: e.target.value.slice(0, 1) })}
                                            className="terminal-input text-xs" maxLength="1" />
                                    </div>
                                    <div>
                                        <label className="text-electric-cyan text-xs block mb-1">Hint Text</label>
                                        <input type="text" value={form.hint} onChange={e => setForm({ ...form, hint: e.target.value })}
                                            className="terminal-input text-xs" placeholder="Optional hint" />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-terminal-border">
                                    <button onClick={handleSave} className="btn-primary text-xs flex-1">SAVE_QUESTION</button>
                                    {editorMode === 'edit' && (
                                        <button onClick={() => setLiveSwapConfirm(selectedQuestion)} className="btn-danger text-xs flex-1">SAVE_AND_LIVE_SWAP</button>
                                    )}
                                    <button onClick={() => { setEditorMode(null); setSelectedQuestion(null); }} className="btn-cyan text-xs">CANCEL</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-neon-green opacity-50">
                                {'>'} Select a question or click ADD_QUESTION
                            </div>
                        )}
                    </TerminalCard>
                </div>

                {/* RIGHT: Preview + Live Status (25%) */}
                <div className="col-span-12 lg:col-span-3 overflow-y-auto">
                    <TerminalCard title="[PREVIEW]">
                        {previewData ? (
                            <div className="space-y-3 text-xs">
                                <CipherBadge type={previewData.cipherType} />
                                {previewData.encryptedText && <p className="text-neon-green break-all">{previewData.encryptedText}</p>}
                                {previewData.codeSnippet && <pre className="text-neon-green text-xs">{previewData.codeSnippet}</pre>}
                                {previewData.imageUrl && <img src={previewData.imageUrl} alt="cipher" className="max-w-full rounded" />}
                                <div className="pt-2 border-t border-terminal-border space-y-1">
                                    <p className={previewData.hasCorrectAnswer ? 'text-neon-green' : 'text-danger-red'}>
                                        {previewData.hasCorrectAnswer ? '✓' : '✗'} Answer set
                                    </p>
                                    <p className={previewData.hintSet ? 'text-neon-green' : 'text-warning-yellow'}>
                                        {previewData.hintSet ? '✓' : '⚠'} Hint set
                                    </p>
                                    <p className={previewData.hasImage ? 'text-neon-green' : 'text-neon-green opacity-50'}>
                                        {previewData.hasImage ? '✓' : '—'} Image
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-neon-green opacity-50 text-xs">
                                Click Preview on a question
                            </div>
                        )}
                    </TerminalCard>
                </div>
            </div>

            {/* Live Swap Confirm */}
            {liveSwapConfirm && (
                <div className="fullscreen-overlay" onClick={() => setLiveSwapConfirm(null)}>
                    <TerminalCard title="[⚠ LIVE SWAP CONFIRMATION]" className="max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="space-y-4 text-sm">
                            <p className="text-warning-yellow">This will update the question for all teams currently solving it.</p>
                            <p className="text-electric-cyan text-xs">✓ DB updated | ✓ Wrong attempts cleared | ✓ Affected teams notified</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleLiveSwap(true)} className="btn-danger text-xs flex-1">CONFIRM_LIVE_SWAP (NOTIFY)</button>
                                <button onClick={() => handleLiveSwap(false)} className="btn-primary text-xs flex-1">SWAP_SILENT</button>
                                <button onClick={() => setLiveSwapConfirm(null)} className="btn-cyan text-xs">CANCEL</button>
                            </div>
                        </div>
                    </TerminalCard>
                </div>
            )}

            {/* Bulk Import */}
            {showBulk && (
                <div className="fullscreen-overlay" onClick={() => setShowBulk(false)}>
                    <TerminalCard title="[BULK IMPORT]" className="max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="space-y-4">
                            <textarea id="bulkJson" className="terminal-input text-xs h-48 resize-none w-full" placeholder='Paste JSON here...' />
                            <div className="flex gap-2">
                                <button onClick={() => handleBulkImport(document.getElementById('bulkJson').value)} className="btn-primary text-xs flex-1">IMPORT</button>
                                <button onClick={() => setShowBulk(false)} className="btn-danger text-xs">CANCEL</button>
                            </div>
                        </div>
                    </TerminalCard>
                </div>
            )}

            {/* Audit Log */}
            {showAudit && (
                <div className="fullscreen-overlay" onClick={() => setShowAudit(false)}>
                    <TerminalCard title="[AUDIT LOG]" className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <AuditLogView getAuditLog={getAuditLog} />
                        <button onClick={() => setShowAudit(false)} className="btn-danger text-xs mt-4">CLOSE</button>
                    </TerminalCard>
                </div>
            )}
        </div>
    );
};

const AuditLogView = ({ getAuditLog }) => {
    const [logs, setLogs] = useState([]);
    useEffect(() => { getAuditLog().then(data => setLogs(data.logs || [])); }, [getAuditLog]);

    return (
        <div className="space-y-2 text-xs">
            {logs.map(log => (
                <div key={log._id} className="border-b border-terminal-border pb-2">
                    <div className="flex justify-between">
                        <span className="text-electric-cyan">{log.action}</span>
                        <span className="text-neon-green opacity-50">{new Date(log.performedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-neon-green opacity-70">By: {log.performedBy} | Round: {log.roundNumber}</p>
                    {log.changedFields?.length > 0 && (
                        <p className="text-warning-yellow">Changed: {log.changedFields.join(', ')}</p>
                    )}
                </div>
            ))}
            {logs.length === 0 && <p className="text-neon-green opacity-50 text-center py-4">No audit entries</p>}
        </div>
    );
};

export default SystemConsole;
