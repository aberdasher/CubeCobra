import React, { useMemo, useState, useEffect } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'components/base/Modal';
import Button from 'components/base/Button';
import Input from 'components/base/Input';
import Text from 'components/base/Text';
import CSRFForm from 'components/CSRFForm';

interface UploadBulkReplaceModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  cubeID: string;
}

const UploadBulkReplaceModal: React.FC<UploadBulkReplaceModalProps> = ({ isOpen, setOpen, cubeID }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const formRef = React.createRef<HTMLFormElement>();

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFileContent(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  const formData = useMemo(
    () => ({
      file: fileContent,
    }),
    [fileContent],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  return (
    <Modal isOpen={isOpen} setOpen={setOpen}>
      <CSRFForm method="POST" action={`/cube/bulkreplace/${cubeID}`} ref={formRef} formData={formData}>
        <ModalHeader setOpen={setOpen}>Upload Bulk Replace</ModalHeader>
        <ModalBody>
          <Text>Upload a CSV file to replace the current cube list.</Text>
          <Input type="file" name="file" accept=".csv" onChange={handleFileChange} />
        </ModalBody>
        <ModalFooter>
          <Button color="accent" type="submit" disabled={!file}>
            Upload
          </Button>
          <Button color="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </CSRFForm>
    </Modal>
  );
};

export default UploadBulkReplaceModal;
