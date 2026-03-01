const fs = require('fs');

const uiHtml = `  return (
    <div className="max-w-7xl mx-auto p-2 md:p-6 h-[calc(100vh-6rem)] min-h-[600px]">
      <div className={\`h-full flex flex-col md:flex-row rounded-2xl border shadow-2xl overflow-hidden \${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-stone-200 bg-white'}\`}>
        
        {/* LEFT SIDEBAR - GROUPS LIST */}
        <aside className={\`w-full md:w-80 flex flex-col border-b md:border-b-0 md:border-r transition-all \${!selectedGroupId ? 'flex' : 'hidden md:flex'} \${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-stone-50/50'}\`}>
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <h1 className="font-cinzel font-bold text-xl flex items-center gap-2">
              <Users size={20} className="text-red-700" />
              Grupelės
            </h1>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowJoinGroup(true)} className={\`p-1.5 rounded-lg border \${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-stone-300 hover:bg-stone-200'} text-xs\`} title="Prisijungti su kodu">
                <Hash size={14} />
              </button>
              <button onClick={() => setShowCreateGroup(true)} className={\`p-1.5 rounded-lg bg-red-900 text-amber-50 hover:bg-red-800\`} title="Kurti naują grupelę">
                <Plus size={14} />
              </button>
            </div>
          </div>
          
          <div className="p-3">
             <button onClick={() => { loadGroups(); if (selectedGroupId) loadPosts(); }} className={\`w-full inline-flex items-center justify-center gap-2 py-1.5 text-xs rounded-lg border \${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-stone-300 hover:bg-stone-200 text-stone-600'}\`}>
                <RefreshCw size={12} />
                Atnaujinti sąrašą
             </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
             {groups.length === 0 ? (
                <div className="text-center py-10 opacity-60 text-sm">Nėra grupių</div>
             ) : (
                groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedGroupId(group.id); setShowGroupInfo(false); }}
                    className={\`w-full text-left rounded-xl p-3 transition flex items-start gap-3 \${
                      selectedGroupId === group.id
                        ? isDark
                          ? 'bg-red-900/20 shadow-inner'
                          : 'bg-red-50/80 shadow-sm'
                        : isDark
                        ? 'hover:bg-slate-800/70'
                        : 'hover:bg-stone-100'
                    }\`}
                  >
                    <div className={\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${
                      selectedGroupId === group.id
                        ? 'bg-red-900 text-white' 
                        : isDark ? 'bg-slate-800 text-slate-400' : 'bg-stone-200 text-stone-500'
                    }\`}>
                      <Users size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={\`font-semibold truncate text-sm \${selectedGroupId === group.id ? (isDark ? 'text-red-400' : 'text-red-900') : ''}\`}>{group.name}</p>
                      </div>
                      <p className={\`text-xs truncate mt-0.5 \${isDark ? 'text-slate-400' : 'text-stone-500'}\`}>
                        {group.description || 'Pokalbis...'}
                      </p>
                    </div>
                  </button>
                ))
             )}
          </div>
        </aside>

        {/* MAIN CHAT */}
        <section className={\`flex-1 flex flex-col relative \${selectedGroupId ? 'flex' : 'hidden md:flex'}\`}>
          {!selectedGroupId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent">
               <div className={\`w-20 h-20 rounded-full flex items-center justify-center mb-4 \${isDark ? 'bg-slate-800 text-slate-500' : 'bg-stone-100 text-stone-400'}\`}>
                  <MessageCircle size={32} />
               </div>
               <h3 className="font-semibold text-xl mb-2">Nepasirinktas pokalbis</h3>
               <p className={\`max-w-sm text-sm \${isDark ? 'text-slate-400' : 'text-stone-500'}\`}>
                 Pasirinkite grupelę iš sąrašo kairėje arba sukurkite naują, kad pradėtumėte bendrauti.
               </p>
            </div>
          ) : !selectedGroup ? null : (
            <>
              {/* Chat Header */}
              <header className={\`px-4 py-3 border-b flex items-center justify-between shrink-0 backdrop-blur-md z-10 \${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-stone-200 bg-white/80'}\`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedGroupId(null)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-800">
                     <ChevronLeft size={20} />
                  </button>
                  <div className={\`w-10 h-10 rounded-full flex items-center justify-center bg-red-900 text-white shrink-0 shadow-md\`}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base leading-tight">{selectedGroup.name}</h2>
                    <p className={\`text-xs flex items-center gap-1 \${isDark ? 'text-slate-400' : 'text-stone-500'}\`}>
                      <Shield size={10} className="inline" /> 
                      {ROLE_LABELS[selectedRole || 'member']}
                      <span className="opacity-50">•</span>
                      <span>{members.length} nariai</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowGroupInfo(!showGroupInfo)} className={\`p-2 rounded-xl transition-colors \${showGroupInfo ? (isDark ? 'bg-slate-800 text-white' : 'bg-stone-200 text-stone-900') : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-stone-500 hover:bg-stone-100 text-stone-900')}\`}>
                    <Info size={18} />
                  </button>
                </div>
              </header>

              {/* Chat Messages */}
              <div className={\`flex-1 overflow-y-auto p-4 md:p-6 space-y-6 \${isDark ? 'bg-[#0f172a]' : 'bg-slate-50/50'}\`}>
                {orderedPosts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <p className="text-sm">Pradėkite pokalbį – pasidalinkite pirmąja žinutė.</p>
                  </div>
                ) : (
                  orderedPosts.map(post => {
                    const isOwnPost = post.author_id === user.id;
                    const summary = reactionsByPost[post.id];
                    const canManagePost = isOwnPost || canModerate;

                    return (
                      <div key={post.id} className={\`flex \${isOwnPost ? 'justify-end' : 'justify-start'}\`}>
                        <div className={\`flex flex-col max-w-[85%] md:max-w-[70%] \${isOwnPost ? 'items-end' : 'items-start'}\`}>
                          <div className={\`text-[10px] uppercase font-medium mb-1 tracking-wider opacity-60 ml-2 mr-2\`}>
                            {isOwnPost ? 'Jūs' : \`\${post.author_id.slice(0, 8)}...\`} • {formatMessageTime(post.created_at)}
                          </div>
                          <div className={\`relative group px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-line \${
                            isOwnPost 
                              ? 'bg-red-900 text-amber-50 rounded-tr-sm' 
                              : isDark 
                                ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700' 
                                : 'bg-white text-stone-800 rounded-tl-sm border border-stone-200'
                          }\`}>
                            {post.scripture_text && (
                              <div className={\`mb-2 pb-2 border-b \${isOwnPost ? 'border-amber-50/20' : isDark ? 'border-slate-700' : 'border-stone-100'}\`}>
                                <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1">
                                  <BookOpen size={10} />
                                  {post.scripture_book} {post.scripture_chapter}:{post.scripture_verses.join(',')}
                                </div>
                                <div className="italic text-[13px] leading-relaxed opacity-90">
                                  "{post.scripture_text}"
                                </div>
                              </div>
                            )}
                            {post.comment && (
                              <div className="leading-relaxed">
                                {post.comment}
                              </div>
                            )}
                          </div>
                          
                          <div className={\`flex items-center gap-1 mt-1 \${isOwnPost ? 'flex-row-reverse' : 'flex-row'}\`}>
                             {REACTIONS.map(emoji => {
                               const count = summary?.counts?.[emoji] || 0;
                               if (count === 0 && summary?.userReaction !== emoji) return null;
                               return (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(post.id, emoji).then(loadPosts)}
                                    className={\`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border bg-white dark:bg-slate-900 shadow-sm \${
                                      summary?.userReaction === emoji
                                        ? 'border-amber-500 dark:border-amber-600/50'
                                        : 'border-stone-200 dark:border-slate-700'
                                    }\`}
                                  >
                                    <span>{emoji}</span>
                                    <span className="font-semibold opacity-80">{count}</span>
                                  </button>
                               );
                             })}

                             <div className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all flex items-center gap-1 mx-2">
                               {REACTIONS.map(emoji => (
                                 <button
                                   key={\`add-\${emoji}\`}
                                   onClick={() => toggleReaction(post.id, emoji).then(loadPosts)}
                                   className="hover:scale-125 transition-transform text-sm"
                                 >
                                   {emoji}
                                 </button>
                               ))}
                               <button onClick={() => loadComments(post)} className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 ml-1 text-stone-500 dark:text-slate-400" title="Komentarai">
                                 <MessageCircle size={14} />
                               </button>
                               {canManagePost && (
                                 <button
                                   onClick={async () => {
                                     if (!window.confirm('Ištrinti žinutę?')) return;
                                     await deletePost(post.id);
                                     await loadPosts();
                                   }}
                                    className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 dark:text-slate-400" title="Ištrinti"
                                 >
                                   <X size={14} />
                                 </button>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className={\`p-4 shrink-0 transition-colors \${isDark ? 'bg-slate-900/80 border-t border-slate-800' : 'bg-white border-t border-stone-200'}\`}>
                {showBibleAttachment && (
                  <div className={\`mb-3 p-3 rounded-xl border \${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-stone-50 border-stone-200'} animate-in slide-in-from-bottom-2\`}>
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><BookOpen size={12}/> Prisegti Biblijos ištrauką</span>
                        <button onClick={() => setShowBibleAttachment(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                     </div>
                     <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                        <select className={\`col-span-3 sm:col-span-1 min-w-0 text-xs rounded-lg border px-2 py-1.5 \${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-stone-300'}\`} value={source} onChange={e => setSource(e.target.value as any)}>
                          <option value="manual">Rankiniu būdu</option>
                          <option value="bible_reader">Iš skaityklės</option>
                        </select>
                        <input value={book} onChange={e => setBook(e.target.value)} placeholder="Knyga (pvz. Jn)" className={\`min-w-0 text-xs rounded-lg border px-2 py-1.5 \${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-stone-300'}\`} />
                        <input type="number" min={1} value={chapter} onChange={e => setChapter(Number(e.target.value) || 1)} placeholder="Skyrius" className={\`min-w-0 text-xs rounded-lg border px-2 py-1.5 \${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-stone-300'}\`} />
                        <input value={verses} onChange={e => setVerses(e.target.value)} placeholder="Eilutės (1,2-5)" className={\`min-w-0 text-xs rounded-lg border px-2 py-1.5 \${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-stone-300'}\`} />
                     </div>
                     <textarea
                        rows={2}
                        value={scriptureText}
                        onChange={e => setScriptureText(e.target.value)}
                        placeholder="Ištraukos tekstas..."
                        className={\`w-full text-sm rounded-lg border px-2 py-1.5 \${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-stone-300'}\`}
                     />
                  </div>
                )}
                
                <form onSubmit={submitPost} className="flex items-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowBibleAttachment(!showBibleAttachment)} 
                    className={\`p-3 rounded-xl transition \${showBibleAttachment ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'} shrink-0\`}
                    title="Prisegti ištrauką"
                  >
                    <BookOpen size={18} />
                  </button>
                  <div className={\`flex-1 relative border rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-red-900/50 transition-shadow \${isDark ? 'bg-slate-800 border-slate-700' : 'bg-stone-50 border-stone-300'}\`}>
                    <textarea
                      rows={Math.min(5, Math.max(1, comment.split('\\n').length))}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Rašyti žinutę..."
                      className="w-full bg-transparent p-3 text-sm focus:outline-none resize-none max-h-32"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        }
                      }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || (!comment.trim() && !scriptureText.trim())}
                    className="p-3 shrink-0 rounded-xl bg-red-900 text-amber-50 hover:bg-red-800 disabled:opacity-50 disabled:hover:bg-red-900 transition-colors"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Floating Actions/Notices */}
          {(error || success) && (
            <div className={\`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm border font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 \${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}\`}>
              {error ? <X size={14}/> : <Check size={14}/>}
              {error || success}
            </div>
          )}
        </section>

        {/* RIGHT INFO SIDEBAR (MEMBERS & MANAGEMENT) */}
        {selectedGroup && showGroupInfo && (
          <aside className={\`w-full md:w-80 flex flex-col shrink-0 border-l \${isDark ? 'border-slate-800 bg-slate-900/40' : 'border-stone-200 bg-stone-50/50'} z-20\`}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                 <Info size={18} className="text-red-700"/> Informacija
              </h3>
              <button onClick={() => setShowGroupInfo(false)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                 <h4 className="text-xs uppercase font-bold tracking-wider mb-2 opacity-60">Grupės aprašymas</h4>
                 <p className="text-sm">{selectedGroup.description || 'Nėra aprašymo.'}</p>
                 
                 {canModerate && (
                   <div className="mt-4 p-3 rounded-xl border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                     <p className="text-xs font-semibold mb-1">Pakvietimo kodas</p>
                     <div className="flex items-center justify-between gap-2">
                        <code className="text-sm font-mono tracking-widest bg-black/10 dark:bg-black/20 px-2 py-1 rounded">{selectedGroup.invite_code}</code>
                        {isOwner && (
                          <button onClick={async () => {
                            try {
                              const code = await rotateInviteCode(selectedGroup.id);
                              setGroups(prev => prev.map(group => group.id === selectedGroup.id ? { ...group, invite_code: code } : group));
                              setNotice('Kodas pakeistas.', 'success');
                            } catch(e:any) { setNotice('Klaida keičiant kodą.', 'error'); }
                          }} className="text-xs px-2 py-1 rounded border hover:bg-black/5 dark:hover:bg-white/5 dark:border-slate-700">
                             <RotateCw size={12}/>
                          </button>
                        )}
                     </div>
                   </div>
                 )}
              </div>

              {canModerate && pendingRequests.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider mb-2 flex items-center gap-1 opacity-60 text-amber-600 dark:text-amber-500">
                    <Shield size={12}/> Laukiantys prašymai
                  </h4>
                  <div className="space-y-2">
                     {pendingRequests.map(request => (
                       <div key={request.id} className="p-2 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
                         <p className="text-xs font-medium truncate mb-1">{request.requester_id}</p>
                         {request.message && <p className="text-[11px] mb-2 opacity-80 bg-black/5 dark:bg-black/20 p-1.5 rounded">{request.message}</p>}
                         <div className="flex gap-1">
                           <button onClick={async () => {
                             try { await reviewJoinRequest(request.id, 'approved'); await loadManagement(); await loadGroups(); }
                             catch(e) { setNotice('Klaida tvirtinant', 'error'); }
                           }} className="flex-1 text-[10px] py-1 bg-green-700 text-white rounded font-semibold uppercase">Tvirtinti</button>
                           <button onClick={async () => {
                             try { await reviewJoinRequest(request.id, 'rejected'); await loadManagement(); }
                             catch(e) { setNotice('Klaida atmetant', 'error'); }
                           }} className="flex-1 text-[10px] py-1 bg-red-700 text-white rounded font-semibold uppercase">Atmesti</button>
                         </div>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              <div>
                 <h4 className="text-xs uppercase font-bold tracking-wider mb-2 opacity-60">Nariai ({members.length})</h4>
                 <div className="space-y-2">
                   {members.map(member => {
                     const isCurrent = member.user_id === user.id;
                     const canRemove = !isCurrent && (isOwner || (selectedRole === 'moderator' && member.role === 'member')) && member.role !== 'owner';
                     
                     return (
                        <div key={member.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                           <div className="min-w-0 flex-1">
                             <p className="text-sm font-medium truncate">{member.user_id}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                               {isOwner && !isCurrent && member.role !== 'owner' ? (
                                  <select value={member.role} onChange={e => handleSetRole(member.user_id, e.target.value as GroupMemberRole)} className="text-[10px] py-0 px-1 rounded border bg-transparent">
                                    <option value="member">Narys</option>
                                    <option value="moderator">Mod.</option>
                                  </select>
                               ) : (
                                  <span className={\`text-[10px] uppercase font-bold px-1 rounded \${member.role === 'owner' ? 'bg-red-900/20 text-red-900 dark:bg-red-900/40 dark:text-red-400' : member.role === 'moderator' ? 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-400' : 'bg-black/10 dark:bg-white/10 opacity-70'}\`}>
                                    {ROLE_LABELS[member.role]}
                                  </span>
                               )}
                               {isCurrent && <span className="text-[10px] italic opacity-60">(Jūs)</span>}
                             </div>
                           </div>
                           {canRemove && (
                              <button onClick={() => handleRemoveMember(member.user_id)} className="ml-2 text-xs text-red-700 dark:text-red-500 hover:underline">
                                 Šalinti
                              </button>
                           )}
                        </div>
                     )
                   })}
                 </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* MODALS */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateGroup(false)} />
          <div className={\`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 \${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}\`}>
             <h3 className="font-cinzel font-bold text-2xl mb-1">Kurti grupelę</h3>
             <p className="text-sm opacity-60 mb-4">Sukurkite naują privačią erdvę bendrystei.</p>
             <form onSubmit={e => { submitCreateGroup(e); if(isCreateNameValid) setShowCreateGroup(false); }} className="space-y-3">
                <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Grupės pavadinimas" className={\`w-full rounded-xl border px-3 py-2 text-sm \${isDark ? 'bg-slate-950 border-slate-700' : 'bg-stone-50 border-stone-300'}\`} />
                <textarea value={createDescription} onChange={e => setCreateDescription(e.target.value)} placeholder="Aprašymas (nebūtina)" rows={3} className={\`w-full rounded-xl border px-3 py-2 text-sm \${isDark ? 'bg-slate-950 border-slate-700' : 'bg-stone-50 border-stone-300'}\`} />
                <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setShowCreateGroup(false)} className="flex-1 py-2 rounded-xl text-sm font-medium opacity-70 hover:opacity-100 transition">Atšaukti</button>
                   <button type="submit" disabled={!isCreateNameValid || loading} className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-900 text-amber-50 hover:bg-red-800 disabled:opacity-50">Kurti</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {showJoinGroup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowJoinGroup(false)} />
          <div className={\`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 \${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}\`}>
             <h3 className="font-cinzel font-bold text-2xl mb-1">Prisijungti</h3>
             <p className="text-sm opacity-60 mb-4">Įveskite pakvietimo kodą (6 raidės/skaičiai).</p>
             <form onSubmit={e => { submitJoin(e); if(joinCode.trim()) setShowJoinGroup(false); }} className="space-y-3">
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="KODAS" className={\`w-full rounded-xl border px-3 py-2 text-center text-lg font-mono tracking-widest uppercase font-bold focus:ring-2 focus:ring-red-900/50 outline-none \${isDark ? 'bg-slate-950 border-slate-700' : 'bg-stone-50 border-stone-300'}\`} />
                <textarea value={joinMessage} onChange={e => setJoinMessage(e.target.value)} placeholder="Trumpa žinutė grupei (nebūtina)" rows={2} className={\`w-full rounded-xl border px-3 py-2 text-sm \${isDark ? 'bg-slate-950 border-slate-700' : 'bg-stone-50 border-stone-300'}\`} />
                <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setShowJoinGroup(false)} className="flex-1 py-2 rounded-xl text-sm font-medium opacity-70 hover:opacity-100 transition">Atšaukti</button>
                   <button type="submit" disabled={!joinCode.trim() || loading} className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-900 text-amber-50 hover:bg-red-800 disabled:opacity-50 flex justify-center items-center">
                     {loading ? <Loader2 size={16} className="animate-spin" /> : 'Prašytis'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {drawerPost && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerPost(null)} />
          <aside className={\`relative w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right-8 \${isDark ? 'bg-slate-900 border-l border-slate-700' : 'bg-white border-l border-stone-300'}\`}>
            <header className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
               <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageCircle size={18} className="text-red-700" /> Komentarai
               </h3>
               <button onClick={() => setDrawerPost(null)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><X size={18}/></button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/5 dark:bg-black/20">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-sm opacity-80 text-sm italic whitespace-pre-line relative">
                <div className="absolute -left-1.5 top-4 w-3 h-3 bg-white dark:bg-slate-800 border-l border-b dark:border-slate-700 rotate-45"></div>
                {drawerPost.comment}
              </div>

              {(commentsByParent.root || []).map(root => (
                <div key={root.id} className={\`rounded-2xl p-3 shadow-sm \${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-stone-200'}\`}>
                  <div className="flex items-center justify-between mb-1">
                     <p className="text-xs font-semibold opacity-70">{root.author_id.slice(0, 10)}</p>
                     <p className="text-[10px] opacity-50">{formatMessageTime(root.created_at)}</p>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line mb-2">{root.body}</p>
                  
                  <div className="flex gap-2 text-xs">
                     <button onClick={() => setReplyToId(root.id)} className="font-medium text-red-700 dark:text-red-400 opacity-80 hover:opacity-100">Atsakyti</button>
                     {(root.author_id === user.id || canModerate) && (
                        <button onClick={async () => {
                          if (!window.confirm('Trinti komentarą?')) return;
                          await deleteComment(root.id);
                          await loadComments(drawerPost);
                        }} className="font-medium text-red-700 opacity-60 hover:opacity-100">Trinti</button>
                     )}
                  </div>

                  <div className="mt-3 pl-3 border-l-2 border-red-900/10 dark:border-red-900/20 space-y-3">
                     {(commentsByParent[root.id] || []).map(reply => (
                       <div key={reply.id} className="text-sm">
                         <div className="flex items-center gap-2 mb-0.5">
                           <span className="font-semibold text-xs opacity-70">{reply.author_id.slice(0, 10)}</span>
                           <span className="text-[10px] opacity-50">{formatMessageTime(reply.created_at)}</span>
                         </div>
                         <p className="opacity-90 leading-relaxed whitespace-pre-line">{reply.body}</p>
                         {(reply.author_id === user.id || canModerate) && (
                            <button onClick={async () => {
                              if (!window.confirm('Trinti komentarą?')) return;
                              await deleteComment(reply.id);
                              await loadComments(drawerPost);
                            }} className="mt-1 text-[10px] uppercase font-bold text-red-700 opacity-50 hover:opacity-100">Trinti</button>
                         )}
                       </div>
                     ))}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={async e => {
              e.preventDefault();
              if(!commentInput.trim()) return;
              await createComment(drawerPost.id, commentInput.trim(), replyToId);
              setCommentInput('');
              setReplyToId(null);
              await loadComments(drawerPost);
            }} className="p-4 border-t border-black/10 dark:border-white/10 shrink-0 bg-white dark:bg-slate-900">
               {replyToId && (
                 <div className="mb-2 text-xs flex justify-between items-center bg-red-900/10 text-red-900 dark:bg-red-900/20 dark:text-red-300 px-3 py-1.5 rounded-lg border border-red-900/20">
                   <span>Atsakymas...</span>
                   <button type="button" onClick={() => setReplyToId(null)} className="opacity-70 hover:opacity-100"><X size={14}/></button>
                 </div>
               )}
               <div className="flex items-end gap-2">
                 <textarea
                   rows={2}
                   value={commentInput}
                   onChange={e => setCommentInput(e.target.value)}
                   placeholder="Rašyti komentarą..."
                   className={\`flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/50 resize-none \${isDark ? 'bg-slate-950 border-slate-700' : 'bg-stone-50 border-stone-300'}\`}
                   onKeyDown={e => {
                     if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
                   }}
                 />
                 <button type="submit" disabled={!commentInput.trim() || loading} className="p-2.5 rounded-xl bg-red-900 text-amber-50 hover:bg-red-800 disabled:opacity-50 shrink-0">
                    <Send size={16} />
                 </button>
               </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );`;

let content = fs.readFileSync('components/Views/PrayerGroups.tsx', 'utf8');
const startStr = '  return (';
const endStr = '  async function handleSetRole(';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + uiHtml + '\\n\\n  ' + content.substring(endIndex);
    fs.writeFileSync('components/Views/PrayerGroups.tsx', content);
    console.log('Replaced successfully');
} else {
    console.log('Could not replace', {
        hasStart: startIndex !== -1,
        hasEnd: endIndex !== -1
    });
}
