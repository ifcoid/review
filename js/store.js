/**
 * store.js — localStorage-based state management
 * Single source of truth for all SLR data.
 */

const STORAGE_KEY = 'slr_manager_v1';

const DEFAULT_STATE = {
    meta: {
        title: '',
        createdAt: null,
        updatedAt: null,
    },
    planning: {
        questions: [],       // { id, code, question, rationale }
        pico: {
            population: '',
            intervention: '',
            comparison: '',
            outcome: '',
        },
        criteria: {
            inclusion: [],   // { id, text }
            exclusion: [],   // { id, text }
        },
        keywords: [],        // { id, group, terms: [], operator: 'AND'|'OR' }
        sources: [],         // { id, name, url, abbr }
    },
    conducting: {
        searches: [],        // { id, sourceId, query, date, resultCount, notes }
    },
    studies: [],             // { id, title, authors, year, source, doi, abstract, verdict, qaScores, tags, notes, extractedData }
};

const QA_QUESTIONS = [
    'Apakah tujuan penelitian didefinisikan dengan jelas?',
    'Apakah desain penelitian sesuai dengan tujuan?',
    'Apakah metode pengumpulan data dijelaskan secara rinci?',
    'Apakah validitas dan reliabilitas dibahas?',
    'Apakah analisis data dijelaskan secara memadai?',
    'Apakah temuan disajikan dengan jelas?',
    'Apakah keterbatasan penelitian dibahas?',
    'Apakah kesimpulan didukung oleh data?',
];

export { QA_QUESTIONS };

let _state = null;
const _listeners = new Set();

function _load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Deep merge with defaults to handle schema evolution
            _state = deepMerge(structuredClone(DEFAULT_STATE), parsed);
        } else {
            _state = structuredClone(DEFAULT_STATE);
            _state.meta.createdAt = new Date().toISOString();
        }
    } catch {
        _state = structuredClone(DEFAULT_STATE);
    }
}

function _save() {
    _state.meta.updatedAt = new Date().toISOString();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (e) {
        console.warn('Store: failed to save', e);
    }
    _notify();
}

function _notify() {
    _listeners.forEach(fn => fn(_state));
}

function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key] || typeof target[key] !== 'object') target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const store = {
    get state() {
        if (!_state) _load();
        return _state;
    },

    subscribe(fn) {
        _listeners.add(fn);
        return () => _listeners.delete(fn);
    },

    /** Meta */
    setTitle(title) {
        _state.meta.title = title;
        _save();
    },

    /** Planning — Research Questions */
    addQuestion(data) {
        const code = `RQ${_state.planning.questions.length + 1}`;
        _state.planning.questions.push({ id: uid(), code, ...data });
        _save();
    },
    updateQuestion(id, data) {
        const idx = _state.planning.questions.findIndex(q => q.id === id);
        if (idx !== -1) { Object.assign(_state.planning.questions[idx], data); _save(); }
    },
    deleteQuestion(id) {
        _state.planning.questions = _state.planning.questions.filter(q => q.id !== id);
        // Renumber codes
        _state.planning.questions.forEach((q, i) => { q.code = `RQ${i + 1}`; });
        _save();
    },

    /** Planning — PICO */
    setPICO(pico) {
        Object.assign(_state.planning.pico, pico);
        _save();
    },

    /** Planning — Criteria */
    addCriteria(type, text) {
        _state.planning.criteria[type].push({ id: uid(), text });
        _save();
    },
    deleteCriteria(type, id) {
        _state.planning.criteria[type] = _state.planning.criteria[type].filter(c => c.id !== id);
        _save();
    },

    /** Planning — Keywords */
    addKeywordGroup(data) {
        _state.planning.keywords.push({ id: uid(), ...data });
        _save();
    },
    updateKeywordGroup(id, data) {
        const idx = _state.planning.keywords.findIndex(k => k.id === id);
        if (idx !== -1) { Object.assign(_state.planning.keywords[idx], data); _save(); }
    },
    deleteKeywordGroup(id) {
        _state.planning.keywords = _state.planning.keywords.filter(k => k.id !== id);
        _save();
    },

    /** Planning — Sources */
    addSource(data) {
        _state.planning.sources.push({ id: uid(), ...data });
        _save();
    },
    deleteSource(id) {
        _state.planning.sources = _state.planning.sources.filter(s => s.id !== id);
        _save();
    },

    /** Conducting — Searches */
    addSearch(data) {
        _state.conducting.searches.push({ id: uid(), date: new Date().toISOString().split('T')[0], ...data });
        _save();
    },
    deleteSearch(id) {
        _state.conducting.searches = _state.conducting.searches.filter(s => s.id !== id);
        _save();
    },

    /** Studies */
    addStudy(data) {
        const study = {
            id: uid(),
            title: '',
            authors: '',
            year: '',
            source: '',
            doi: '',
            abstract: '',
            verdict: 'pending', // pending | include | exclude | maybe
            qaScores: {},        // { q0: 'yes'|'partial'|'no', ... }
            tags: [],
            notes: '',
            extractedData: {
                methodology: '',
                sampleSize: '',
                metrics: '',
                findings: '',
            },
            addedAt: new Date().toISOString(),
            ...data,
        };
        _state.studies.push(study);
        _save();
        return study;
    },
    updateStudy(id, data) {
        const idx = _state.studies.findIndex(s => s.id === id);
        if (idx !== -1) { Object.assign(_state.studies[idx], data); _save(); }
    },
    deleteStudy(id) {
        _state.studies = _state.studies.filter(s => s.id !== id);
        _save();
    },
    setVerdict(id, verdict) {
        this.updateStudy(id, { verdict });
    },
    setQAScore(studyId, questionIdx, value) {
        const study = _state.studies.find(s => s.id === studyId);
        if (study) {
            if (!study.qaScores) study.qaScores = {};
            study.qaScores[`q${questionIdx}`] = value;
            _save();
        }
    },

    /** Computed helpers */
    getStats() {
        const studies = _state.studies;
        const total = studies.length;
        const included = studies.filter(s => s.verdict === 'include').length;
        const excluded = studies.filter(s => s.verdict === 'exclude').length;
        const maybe    = studies.filter(s => s.verdict === 'maybe').length;
        const pending  = studies.filter(s => s.verdict === 'pending').length;

        const searches = _state.conducting.searches;
        const totalFound = searches.reduce((sum, s) => sum + (Number(s.resultCount) || 0), 0);

        return { total, included, excluded, maybe, pending, totalFound };
    },

    getQAScore(study) {
        if (!study.qaScores) return null;
        const answers = Object.values(study.qaScores);
        if (answers.length === 0) return null;
        let score = 0;
        answers.forEach(v => {
            if (v === 'yes') score += 1;
            else if (v === 'partial') score += 0.5;
        });
        return Math.round((score / QA_QUESTIONS.length) * 10);
    },

    getProgress() {
        let done = 0, total = 5;
        if (_state.planning.questions.length > 0) done++;
        if (_state.planning.pico.population || _state.planning.pico.outcome) done++;
        if (_state.planning.criteria.inclusion.length > 0) done++;
        if (_state.studies.length > 0) done++;
        if (_state.studies.some(s => s.verdict === 'include')) done++;
        return Math.round((done / total) * 100);
    },

    /** Import / Export */
    exportJSON() {
        return JSON.stringify(_state, null, 2);
    },
    importJSON(json) {
        const parsed = JSON.parse(json);
        _state = deepMerge(structuredClone(DEFAULT_STATE), parsed);
        _save();
    },
};

// Init on first import
_load();
