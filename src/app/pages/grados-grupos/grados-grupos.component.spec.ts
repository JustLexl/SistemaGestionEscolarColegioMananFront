import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradosGruposComponent } from './grados-grupos.component';

describe('GradosGruposComponent', () => {
  let component: GradosGruposComponent;
  let fixture: ComponentFixture<GradosGruposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradosGruposComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradosGruposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
