-- Permitir que usuários apaguem suas próprias respostas
CREATE POLICY "Users can delete own replies"
ON contact_replies
FOR DELETE
USING (auth.uid() = sender_id);

-- Permitir que usuários editem suas próprias respostas
CREATE POLICY "Users can update own replies"
ON contact_replies
FOR UPDATE
USING (auth.uid() = sender_id);