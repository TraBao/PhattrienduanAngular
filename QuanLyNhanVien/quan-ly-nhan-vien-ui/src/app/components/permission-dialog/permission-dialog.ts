import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { PERMISSIONS } from '../../models/permissions';
import { MatCheckboxModule } from '@angular/material/checkbox'; 

@Component({
  selector: 'app-permission-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatCheckboxModule],
  templateUrl: './permission-dialog.html'
})
export class PermissionDialogComponent {
  availablePermissions = PERMISSIONS;
  selectedPermissions: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<PermissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.permissions) {
        this.selectedPermissions = data.permissions.split(',');
    }
  }

  isChecked(code: string): boolean {
    return this.selectedPermissions.includes(code);
  }

  togglePermission(code: string) {
    if (this.isChecked(code)) {
        this.selectedPermissions = this.selectedPermissions.filter(p => p !== code);
    } else {
        this.selectedPermissions.push(code);
    }
  }

  save() {
    this.dialogRef.close(this.selectedPermissions.join(','));
  }
}