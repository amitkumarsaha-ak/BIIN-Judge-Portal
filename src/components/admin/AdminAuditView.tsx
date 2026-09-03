import React, { useState, useMemo } from 'react';
import {
  History, Search, FolderGit2,
  DoorOpen, Users, CheckSquare, Settings
} from 'lucide-react';
import { getAuditLogs } from '../../services/storage';

export const AdminAuditView: React.FC = () => {
  const auditLogs = getAuditLogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return auditLogs.filter(log => {
      if (filterType !== 'All' && log.targetType !== filterType) {
        return false;
      }
      if (q) {
        const hay = [
          log.actorName,
          log.actorEmail,
          log.action,
          log.details
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [auditLogs, searchQuery, filterType]);

  const getTargetIcon = (target: string) => {
    switch (target) {
      case 'project': return FolderGit2;
      case 'room': return DoorOpen;
      case 'judge': return Users;
      case 'evaluation': return CheckSquare;
      default: return Settings;
    }
  };

  const getTargetBadgeColor = (target: string) => {
    switch (target) {
      case 'project': return 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20';
      case 'room': return 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/20';
      case 'judge': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20';
      case 'evaluation': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20';
      default: return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-violet-50 dark:bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 mb-2">
            <History className="h-3.5 w-3.5" />
            <span>Immutable System Activity Logs</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Audit History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete audit trail of all project creations, room assignments, judge accounts, and evaluation override operations.
          </p>
        </div>

        <div className="rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 p-4 text-center shrink-0">
          <p className="text-[10px] uppercase font-bold text-violet-700 dark:text-violet-300">Total Audit Records</p>
          <p className="font-heading text-3xl font-extrabold text-violet-600 dark:text-violet-400 mt-0.5">{auditLogs.length}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 h-full w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by actor, action, or details..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-violet-500"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
        >
          <option value="All">All Entity Types</option>
          <option value="project">Project Events</option>
          <option value="room">Room Events</option>
          <option value="judge">Judge Events</option>
          <option value="evaluation">Evaluation Events</option>
          <option value="settings">Settings & Locks</option>
        </select>
      </div>

      {/* Audit Logs Stream */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6 space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <History className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No audit events match your filters</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => {
              const Icon = getTargetIcon(log.targetType);
              return (
                <div
                  key={log.id}
                  className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${getTargetBadgeColor(log.targetType)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{log.actorName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({log.actorEmail})</span>
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${getTargetBadgeColor(log.targetType)}`}>
                          {log.action}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{log.details}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 text-slate-400 font-mono text-[11px]">
                    <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
