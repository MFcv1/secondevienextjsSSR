'use client';

// FICHIER TEMPORAIRE DE VERIFICATION VISUELLE - A SUPPRIMER
import React from 'react';
import AdminPublicationWorkspace from '../../src/kit/admin/AdminPublicationWorkspace';

export default function TmpPublicationPreview() {
  return (
    <div className="xl:h-[100dvh] xl:overflow-hidden bg-[#FAFAF9] text-stone-900">
      <main className="max-w-none px-4 py-8 sm:px-6 lg:px-7 2xl:px-10 xl:grid xl:h-full xl:grid-rows-[auto_minmax(0,1fr)] xl:gap-5 xl:py-6">
        <div />
        <AdminPublicationWorkspace
          collectionName="furniture"
          darkMode={false}
          editData={null}
          onCancelEdit={() => {}}
          onEdit={() => {}}
          onToggleStatus={() => {}}
          onDelete={() => {}}
          onMarkAsSold={() => {}}
          onMarkAsAvailable={() => {}}
        />
      </main>
    </div>
  );
}
