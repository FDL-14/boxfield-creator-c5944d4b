
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch
} from '@mui/material';

interface AddBoxDialogProps {
  open: boolean;
  onClose: () => void;
  onAddBox: (boxData: any) => void;
}

const AddBoxDialog: React.FC<AddBoxDialogProps> = ({ open, onClose, onAddBox }) => {
  const [title, setTitle] = useState('');
  const [lockWhenSigned, setLockWhenSigned] = useState(true);

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onAddBox({
      title,
      lockWhenSigned
    });
    
    // Reset form
    setTitle('');
    setLockWhenSigned(true);
  };

  const handleClose = () => {
    setTitle('');
    setLockWhenSigned(true);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar Nova Seção</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Título da Seção"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <FormControlLabel
          control={
            <Switch
              checked={lockWhenSigned}
              onChange={(e) => setLockWhenSigned(e.target.checked)}
            />
          }
          label="Travar seção após documento ser assinado"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} color="primary" disabled={!title.trim()}>
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBoxDialog;
