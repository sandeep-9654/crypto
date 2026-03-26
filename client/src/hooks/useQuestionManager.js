import { useState, useCallback } from 'react';
import api from '../utils/api';

const QM_PREFIX = process.env.REACT_APP_QM_PREFIX || 'v2/sys/qm';

const useQuestionManager = () => {
    const [questions, setQuestions] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchQuestions = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const res = await api.get(`/${QM_PREFIX}/questions`, { params });
            setQuestions(res.data.questions);
            return res.data;
        } catch (err) {
            setError(err.response?.data?.error || 'FETCH_ERROR');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRounds = useCallback(async () => {
        try {
            const res = await api.get(`/${QM_PREFIX}/rounds`);
            setRounds(res.data.rounds);
            return res.data.rounds;
        } catch (err) {
            setError(err.response?.data?.error || 'FETCH_ERROR');
        }
    }, []);

    const createQuestion = async (data) => {
        const res = await api.post(`/${QM_PREFIX}/questions`, data);
        return res.data;
    };

    const updateQuestion = async (id, data) => {
        const res = await api.put(`/${QM_PREFIX}/questions/${id}`, data);
        return res.data;
    };

    const deleteQuestion = async (id) => {
        const res = await api.delete(`/${QM_PREFIX}/questions/${id}`);
        return res.data;
    };

    const reorderQuestions = async (roundNumber, orderedIds) => {
        const res = await api.post(`/${QM_PREFIX}/questions/reorder`, { roundNumber, orderedIds });
        return res.data;
    };

    const liveSwap = async (questionId, newContent, notifyTeams) => {
        const res = await api.post(`/${QM_PREFIX}/live-swap`, { questionId, newContent, notifyTeams });
        return res.data;
    };

    const bulkImport = async (data) => {
        const res = await api.post(`/${QM_PREFIX}/questions/bulk`, data);
        return res.data;
    };

    const previewQuestion = async (id) => {
        const res = await api.get(`/${QM_PREFIX}/preview/${id}`);
        return res.data;
    };

    const getAuditLog = async (params = {}) => {
        const res = await api.get(`/${QM_PREFIX}/audit-log`, { params });
        return res.data;
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post(`/${QM_PREFIX}/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.imageUrl;
    };

    return {
        questions, rounds, loading, error,
        fetchQuestions, fetchRounds, createQuestion, updateQuestion,
        deleteQuestion, reorderQuestions, liveSwap, bulkImport,
        previewQuestion, getAuditLog, uploadImage
    };
};

export default useQuestionManager;
