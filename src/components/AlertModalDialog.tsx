import React from 'react';
import { Modal, Button } from "reactstrap";

class AlertModalDialogState {

}

class AlertModalDialogProps {
  policyAlertModal: boolean;
  modalText: string;
  modalType: String;
  toggleAlertModal: (msg: string) => void;
}

class AlertModalDialog extends React.Component<AlertModalDialogProps, AlertModalDialogState>{
  constructor(props: AlertModalDialogProps, state: AlertModalDialogState) {
    super(props, state);
    this.state = {
    }
  }

  render() {
    return (
      <Modal
        size="md"
        isOpen={this.props.policyAlertModal}
        toggle={() => this.props.toggleAlertModal("")}
      >
        <div className="row m-3">
          <div className="col-12">
            <p style={{display: 'inline-block'}}>{this.props.modalText}</p>
            { this.props.modalType !== "Alert" ?
              <div id="wave">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            : null}
          </div>
          <div className="col-9"></div>
          { this.props.modalType === "Alert" ?
          <div className="col-3">
            <Button className="w-100" onClick={() => this.props.toggleAlertModal("")} color="secondary" >OK</Button>
          </div>
          : null}
        </div>
      </Modal>
    )
  }
}

export { AlertModalDialog };