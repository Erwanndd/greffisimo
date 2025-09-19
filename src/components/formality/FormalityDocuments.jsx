import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Upload, Download, Loader2 } from 'lucide-react';

const FormalityDocuments = ({ canUploadDocument, documents, documentsLoading, handleFileSelect, handleAddDocument, handleDownloadDocument, showAddDocDialog, setShowAddDocDialog, selectedFiles, setSelectedFiles }) => (
  <Card className="glass-effect border-white/20">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-white flex items-center"><FileText className="w-5 h-5 mr-2" />Documents</CardTitle>
        {canUploadDocument && (
          <Dialog open={showAddDocDialog} onOpenChange={setShowAddDocDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-blue-400 border-blue-400 hover:bg-blue-400/10 hover:text-blue-300 transition-colors">
                <Plus className="w-4 h-4 mr-2" />Ajouter un document
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Téléverser des documents</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Sélectionnez un ou plusieurs fichiers depuis votre ordinateur pour les ajouter au dossier.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="document-upload" className="text-white">Fichiers</Label>
                  <Input id="document-upload" type="file" multiple onChange={handleFileSelect} className="text-gray-300 file:text-blue-400 hover:file:bg-blue-400/10 file:border-blue-400 file:rounded-md file:mr-4 focus:border-blue-500 focus:ring-blue-500" />
                </div>
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="text-sm text-gray-300">
                    <p className="mb-1">{selectedFiles.length} fichier(s) sélectionné(s) :</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-200 max-h-28 overflow-auto">
                      {selectedFiles.slice(0, 10).map((f, idx) => (
                        <li key={idx}><span className="font-medium text-white">{f.name}</span></li>
                      ))}
                      {selectedFiles.length > 10 && (
                        <li className="text-gray-400">… et {selectedFiles.length - 10} autre(s)</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowAddDocDialog(false); setSelectedFiles([]); }} className="hover:bg-white/10 transition-colors">Annuler</Button>
                <Button onClick={handleAddDocument} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Upload className="w-4 h-4 mr-2" />
                  Confirmer l’envoi
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <CardDescription className="text-gray-300">Documents liés à cette formalité</CardDescription>
    </CardHeader>
    <CardContent>
      {documentsLoading ? (
        <div className="text-center py-8 text-gray-400">
          <Loader2 className="w-12 h-12 mx-auto mb-3 opacity-50 animate-spin" />
          <p>Chargement des documents...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div key={doc.id || index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-white">{doc.displayName || doc.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)} className="text-blue-400 hover:text-blue-300 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun document disponible pour le moment</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default FormalityDocuments;
