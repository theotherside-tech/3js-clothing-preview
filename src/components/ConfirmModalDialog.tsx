import React from 'react';
import { Modal, Button } from "reactstrap";

class ConfirmModalDialogState {

}

class ConfirmModalDialogProps {
  policyConfirmModal: boolean;
  toggleConfirmModal: () => void;
  confirmDelete: () => void;
}

class ConfirmModalDialog extends React.Component<ConfirmModalDialogProps, ConfirmModalDialogState>{
  constructor(props: ConfirmModalDialogProps, state: ConfirmModalDialogState) {
    super(props, state);
    this.state = {
    }
  }

  render() {
    return (
      <Modal
        size="md"
        isOpen={this.props.policyConfirmModal}
        toggle={() => this.props.toggleConfirmModal()}
      >
        <div className="row m-3">
          <div className="col-12">
            <p >Are you sure? </p>
          </div>
          <div className="col-6"></div>
          <div className="col-3">
            <Button className="w-100" onClick={() => this.props.confirmDelete()} color="secondary" >Agree</Button>
          </div>
          <div className="col-3">
            <Button className="w-100" onClick={() => this.props.toggleConfirmModal()} color="secondary" >Cancel</Button>
          </div>
        </div>
      </Modal>
    )
  }
}

export { ConfirmModalDialog };