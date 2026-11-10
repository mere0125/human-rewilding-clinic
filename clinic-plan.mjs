import {CLINIC} from './clinic-spec.mjs?v=20';

// The plan uses the architectural register in metres. Furniture footprints
// follow spatial/clinic.js; fine mechanical and textile detail is simplified.
// No measured environmental field or additional simulated room is implied.
export function renderClinicPlan(selected='reception') {
  const active=CLINIC.zones.some(z=>z.id===selected)?selected:'reception';
  const unit=45, cx=500, cy=368;
  const X=x=>cx+x*unit, Y=z=>cy+z*unit;
  const f=n=>Number(n).toFixed(2);
  const chair=(x,z,yaw)=>`<g transform="translate(${f(X(x))} ${f(Y(z))}) rotate(${f(-yaw*180/Math.PI)})"><circle r="13.05" fill="none" stroke="#9ba998" stroke-width=".8"/><rect x="-13.95" y="-13.28" width="27.90" height="26.55" rx="3.15" class="furniture"/><rect x="-14.63" y="-14.29" width="29.25" height="4.28" rx="1.8" fill="#b1c0a8" stroke="#71816f" stroke-width=".8"/><path d="M-13.95 9V-10M13.95 9V-10" class="fine"/></g>`;
  const left=X(-CLINIC.width/2),right=X(CLINIC.width/2);
  const top=Y(-CLINIC.depth/2),bottom=Y(CLINIC.depth/2);
  const boundary=CLINIC.boundary;
  const support=CLINIC.bodySupport;
  const consultation=CLINIC.furniture.consultation,operations=CLINIC.furniture.operations,caseWindow=CLINIC.furniture.caseWindow;
  const faceTable=(c,t)=>Math.atan2(t[0]-c[0],t[2]-c[1]);
  const platformWidth=support.width*unit,platformLength=support.length*unit;
  const platformLabelY=Y(support.centre[2])+platformLength/2+22;
  const portalLeft=X(-boundary.width/2),portalRight=X(boundary.width/2),portalY=Y(boundary.centre[2]);
  const zoneNames={reception:'Consultation',trial:'Environmental trial',records:'Operations and records'};
  const zoneNumbers={reception:'01',trial:'02',records:'03'};
  const zones=CLINIC.zones.map(z=>{
    const [a,b,c,d]=z.bounds;
    return `<g data-clinic-plan-zone="${z.id}" role="button" tabindex="0" aria-label="Visit ${zoneNames[z.id]}" aria-pressed="${active===z.id}" class="plan-zone${active===z.id?' chosen':''}"><title>${zoneNames[z.id]}</title><rect x="${f(X(a)+3)}" y="${f(Y(c)+3)}" width="${f((b-a)*unit-6)}" height="${f((d-c)*unit-6)}" fill="${active===z.id?'#e3e9e2':'#f2f3ed'}" stroke="none"/><text x="${f(X((a+b)/2))}" y="${f(bottom-83)}" text-anchor="middle" class="zone-number">${zoneNumbers[z.id]}</text><text x="${f(X((a+b)/2))}" y="${f(bottom-61)}" text-anchor="middle" class="zone-name">${zoneNames[z.id]}</text></g>`;
  }).join('');
  return `<svg class="clinic-plan-drawing" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 760" role="group" aria-labelledby="clinicPlanTitle clinicPlanDescription">
  <title id="clinicPlanTitle">The Clinic, ground-floor architectural study</title>
  <desc id="clinicPlanDescription">Three connected spaces, ${CLINIC.width} metres wide and ${CLINIC.depth} metres deep. Consultation at the west, environmental trial in the centre and staff operations at the east. A public route connects consultation to the trial and the patient's own-case window. Staff access is separate. Select a zone to visit it.</desc>
  <defs>
    <pattern id="planMetalHatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V5" stroke="#7c8981" stroke-width=".6"/></pattern>
    <pattern id="planFilterHatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0L6 6M6 0L0 6" stroke="#859984" stroke-width=".4"/></pattern>
    <pattern id="planSoilHatch" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".55" fill="#a3aaa0"/><circle cx="8" cy="9" r=".45" fill="#a3aaa0"/></pattern>
    <pattern id="planMembraneHatch" width="9" height="12" patternUnits="userSpaceOnUse"><path d="M3 0Q5 3 3 6T3 12" fill="none" stroke="#b6c2b8" stroke-width=".55"/></pattern>
    <marker id="planRouteArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1L7 4L1 7" fill="none" stroke="#496952" stroke-width="1.1"/></marker>
    <style>
      .clinic-plan-drawing{background:#f7f7f2;color:#33463a;font-family:Arial,Helvetica,sans-serif}
      .clinic-plan-drawing text{fill:#33463a;font-weight:400}
      .clinic-plan-drawing .plan-zone{cursor:pointer;outline:none}
      .clinic-plan-drawing .plan-zone:focus-visible>rect{stroke:#496952;stroke-width:3}
      .clinic-plan-drawing .plan-zone:hover>rect{fill:#e4e9dd}
      .clinic-plan-drawing .zone-number{font-size:13px;fill:#7d8e7c}
      .clinic-plan-drawing .zone-name{font-size:16px}
      .clinic-plan-drawing .small{font-size:12px;fill:#70826e}
      .clinic-plan-drawing .label{font-size:14px}
      .clinic-plan-drawing .fine{stroke:#829080;stroke-width:.8;fill:none}
      .clinic-plan-drawing .wall{stroke:#596c5d;stroke-width:4;fill:none;stroke-linecap:round;stroke-linejoin:round}
      .clinic-plan-drawing .furniture{stroke:#829186;stroke-width:.85;fill:#ebeee7}
      .clinic-plan-drawing .route{stroke:#496952;stroke-width:1.4;fill:none;stroke-dasharray:5 4;marker-end:url(#planRouteArrow)}
      .clinic-plan-drawing .secondary-route{stroke:#879183;stroke-width:1.1;fill:none;stroke-dasharray:3 4}
    </style>
  </defs>
  <rect x="0" y="0" width="1000" height="760" fill="#f7f7f2"/>
  <text x="80" y="36" font-size="24">Clinic floor plan</text>
  <text x="80" y="58" class="small">Architectural study, one consultation and a shared environmental boundary</text>
  <g aria-hidden="true">
    <rect x="${f(left)}" y="80" width="${f(right-left)}" height="32" fill="url(#planSoilHatch)" stroke="#c1c9ba" stroke-width=".7"/>
    <text x="500" y="101" text-anchor="middle" class="small">Outdoor service strip</text>
    <path d="M906 148V102M900 109L906 101L912 109" class="fine"/>
    <text x="906" y="92" text-anchor="middle" class="label">N</text>
  </g>
  <rect x="${f(left)}" y="${f(top)}" width="${f(right-left)}" height="${f(bottom-top)}" fill="#f2f3ed"/>
  ${zones}
  <g pointer-events="none" aria-hidden="true">
    <!-- The boundary is layered, with service depth between outside and inside. -->
    <path d="M${f(left)} ${f(top)}H${f(portalLeft-8)}M${f(portalRight+8)} ${f(top)}H${f(right)}V${f(bottom)}H${f(X(6.6))}M${f(X(5.4))} ${f(bottom)}H${f(X(-4.9))}M${f(X(-6.4))} ${f(bottom)}H${f(left)}V${f(top)}" class="wall"/>
    <rect x="${f(portalLeft-7)}" y="${f(portalY-7)}" width="${f(portalRight-portalLeft+14)}" height="15" fill="url(#planMetalHatch)" stroke="#687d6c"/>
    <rect x="${f(portalLeft+8)}" y="${f(portalY+12)}" width="${f(portalRight-portalLeft-16)}" height="13" fill="url(#planFilterHatch)" stroke="#71876e"/>
    <path d="M${f(portalLeft-17)} ${f(portalY+37)}H${f(portalRight+17)}" stroke="#a7b3a1" stroke-width="2"/>
    <path d="M${f(portalLeft)} ${f(portalY-22)}H${f(portalRight)}" class="fine"/>
    <text x="500" y="${f(portalY+57)}" text-anchor="middle" class="small">Layered environmental opening</text>
    <!-- Bolted frame plates, readable at the scale of the plan. -->
    ${[-7.8,-2.8,2.8,7.8].flatMap(x=>[-5.4,5.4].map(z=>`<rect x="${f(X(x)-4)}" y="${f(Y(z)-4)}" width="8" height="8" fill="#617562"/>`)).join('')}
    <!-- Straight service partitions share the 3D model's 6.65 metre extent. -->
    ${[[-2.8,-4.375,2.275],[2.8,-4.375,-.05],[2.8,1.25,2.275]].map(([x,a,b])=>`<path d="M${f(X(x))} ${f(Y(a))}V${f(Y(b))}" stroke="#a3b3a3" stroke-width="9" fill="none"/><path d="M${f(X(x))} ${f(Y(a))}V${f(Y(b))}" stroke="#eef2e8" stroke-width="5" fill="none"/>`).join('')}
    <!-- Table, chairs and consent sheet follow the current architectural model. -->
    <g transform="translate(${f(X(-5.06))} ${f(Y(-.40))}) rotate(${f(-.10*180/Math.PI)})">
      <rect x="-48.38" y="-25.20" width="96.75" height="50.40" rx="6.75" fill="url(#planMetalHatch)" stroke="#6e806f" stroke-width="1.1"/>
      <rect x="-43.65" y="-21.15" width="87.30" height="42.30" rx="4.5" fill="#ebeee4" stroke="#99a893" stroke-width=".7"/>
      <g transform="translate(-16.2 0) rotate(-4.58)"><rect x="-9.9" y="-12.6" width="19.8" height="25.2" fill="#f8f7ef" stroke="#8d9c85" stroke-width=".65"/><path d="M-6-7H6M-6-2H6M-6 3H6M-6 8H1" class="fine"/></g>
      <rect x="20.25" y="-9.75" width="17.10" height="8.70" rx="1.4" fill="#788c75" stroke="#617661" stroke-width=".7"/>
    </g>
    ${consultation.chairs.map(c=>chair(c[0],c[1],faceTable(c,consultation.centre))).join('')}
    <rect x="${f(X(-6.85)-14.625)}" y="${f(Y(-3.7)-40.5)}" width="29.25" height="81" rx="7" fill="#bbc9b0" stroke="#7d9276" stroke-width="1"/>
    <text x="${f(X(-5.06))}" y="${f(Y(-.40)+88)}" text-anchor="middle" class="label">Shared consultation table</text>
    <text x="${f(X(-5.06))}" y="${f(Y(-.40)+108)}" text-anchor="middle" class="small">Consent recorded on the table</text>
    <!-- The body platform uses the same dimensions as the 3D register. -->
    <g transform="translate(${f(X(support.centre[0]))} ${f(Y(support.centre[2]))})">
      <rect x="${f(-platformWidth/2)}" y="${f(-platformLength/2)}" width="${f(platformWidth)}" height="${f(platformLength)}" rx="${f(.18*unit)}" fill="url(#planMetalHatch)" stroke="#7e9188" stroke-width="1.1"/>
      <rect x="${f(-platformWidth/2+2.4)}" y="${f(-platformLength/2+2.4)}" width="${f(platformWidth-4.8)}" height="${f(platformLength-4.8)}" rx="${f(.14*unit)}" fill="#f2f3ed" stroke="#b4c0b6" stroke-width=".6"/>
      ${[
        {z:-.80,length:.76,width:.98},
        {z:.04,length:.88,width:1.02},
        {z:.84,length:.66,width:.94}
      ].map(p=>`<rect x="${f(-p.width*unit/2)}" y="${f((p.z-p.length/2)*unit)}" width="${f(p.width*unit)}" height="${f(p.length*unit)}" rx="${f(.13*unit)}" fill="#b6c9bc" stroke="#607c6d" stroke-width=".8"/><rect x="${f(-p.width*unit/2+2.1)}" y="${f((p.z-p.length/2)*unit+2.1)}" width="${f(p.width*unit-4.2)}" height="${f(p.length*unit-4.2)}" rx="${f(.09*unit)}" fill="none" stroke="#d6dfd5" stroke-width=".6"/>`).join('')}
      <rect x="-11.25" y="-47.7" width="22.5" height="9" rx="4.2" fill="#dce4d9" stroke="#81988a" stroke-width=".65"/>
      <path d="M${f(-platformWidth/2)}-6.3H-32.85" class="fine"/>
      <rect x="-36.9" y="-11.7" width="8.1" height="10.8" rx="2.1" fill="#f7f7f2" stroke="#8b9a90" stroke-width=".8"/>
      <circle cx="-32.85" cy="-6.3" r="2.8" fill="#a36e55"/>
    </g>
    <text x="${f(X(support.centre[0]))}" y="${f(platformLabelY)}" text-anchor="middle" class="label">Segmented body platform</text>
    <text x="${f(X(support.centre[0]))}" y="${f(platformLabelY+19)}" text-anchor="middle" class="small">Patient stop within reach</text>
    <!-- Operations is one rectangular folded-sheet desk, not an L-shaped bench. -->
    <g transform="translate(${f(X(5.05))} ${f(Y(-1.55))}) rotate(${f(.10*180/Math.PI)})">
      <rect x="-77.4" y="-27.45" width="154.8" height="54.9" rx="3.375" fill="url(#planMetalHatch)" stroke="#6b806d" stroke-width="1.2"/>
      <rect x="-57.15" y="-13.95" width="45.9" height="5.4" rx=".8" fill="#718a74"/>
      <rect x=".45" y="-13.95" width="45.9" height="5.4" rx=".8" fill="#b4c3aa" stroke="#7e9279" stroke-width=".7"/>
      <rect x="-45" y="9" width="26.1" height="9" rx="1" fill="#ced8c4" stroke="#8b9c81" stroke-width=".6"/>
      <rect x="47.7" y="-2.7" width="18" height="23.4" rx="1" fill="#e4eadb" stroke="#8b9c81" stroke-width=".6"/>
    </g>
    ${chair(operations.chair[0],operations.chair[1],faceTable(operations.chair,operations.centre))}
    ${Array.from({length:5},(_,i)=>`<rect x="${f(X(3.35+i*.72)-14.625)}" y="${f(Y(-4.72)-13.95)}" width="29.25" height="27.9" rx=".765" fill="url(#planMetalHatch)" stroke="#7d8f7b" stroke-width=".8"/>`).join('')}
    <text x="${f(X(5.05))}" y="${f(Y(-1.55)-48)}" text-anchor="middle" class="label">Operation and revision desk</text>
    <!-- The screen projects into a true opening in the right membrane. -->
    <path d="M${f(X(caseWindow.frontX))} ${f(Y(caseWindow.centre[2]-.57))}V${f(Y(caseWindow.centre[2]+.57))}" stroke="#47664e" stroke-width="3"/>
    <rect x="${f(X(caseWindow.frontX)-9)}" y="${f(Y(caseWindow.centre[2]-.57))}" width="14" height="51.3" fill="#e4eadc" stroke="#758b71"/>
    <path d="M${f(X(caseWindow.centre[0])+5)} ${f(Y(.6))}L${f(X(caseWindow.centre[0])+35)} ${f(Y(.6)+35)}" class="fine"/>
    <text x="${f(X(caseWindow.centre[0])+43)}" y="${f(Y(.6)+43)}" class="label">Own-case window</text>
    <text x="${f(X(caseWindow.centre[0])+43)}" y="${f(Y(.6)+61)}" class="small">Readable from the trial</text>
    <!-- Public and staff access are intentionally distinct. -->
    <path d="M${f(X(-5.65))} ${f(bottom+20)}V${f(Y(4.5))}H${f(X(-.3))}V${f(Y(2.1))}" class="route"/>
    <path d="M${f(X(6))} ${f(bottom+20)}V${f(bottom-47)}H${f(X(6.9))}M${f(X(6.9))} ${f(bottom-100)}V${f(Y(.6))}" class="secondary-route"/>
    <path d="M${f(X(6.9))} ${f(Y(.6))}l-4 7m4-7 4 7" class="fine"/>
    <text x="${f(X(-5.65))}" y="${f(bottom+41)}" text-anchor="middle" class="label">Patient access</text>
    <text x="${f(X(6))}" y="${f(bottom+41)}" text-anchor="middle" class="label">Staff access</text>
    <!-- Overall dimensions use one common origin and datum. -->
    <path d="M${f(left)} ${f(bottom+51)}V${f(bottom+77)}M${f(right)} ${f(bottom+51)}V${f(bottom+77)}M${f(left)} ${f(bottom+68)}H${f(right)}" class="fine"/>
    <path d="M${f(left-4)} ${f(bottom+72)}l8-8M${f(right-4)} ${f(bottom+72)}l8-8" class="fine"/>
    <rect x="463" y="${f(bottom+57)}" width="74" height="20" fill="#f7f7f2"/>
    <text x="500" y="${f(bottom+72)}" text-anchor="middle" class="label">${CLINIC.width.toFixed(2)} m</text>
    <path d="M${f(left-16)} ${f(top)}H102M${f(left-16)} ${f(bottom)}H102M112 ${f(top)}V${f(bottom)}" class="fine"/>
    <path d="M108 ${f(top+4)}l8-8M108 ${f(bottom+4)}l8-8" class="fine"/>
    <text transform="translate(102 ${f(cy)}) rotate(-90)" text-anchor="middle" class="label">${CLINIC.depth.toFixed(2)} m</text>
    <g transform="translate(149 713)">
      <rect width="22" height="13" fill="url(#planMetalHatch)" stroke="#7d8c7b" stroke-width=".7"/><text x="31" y="11" class="small">Brushed metal</text>
      <rect x="207" width="22" height="13" fill="url(#planMembraneHatch)" stroke="#a3b3a3" stroke-width=".8"/><text x="238" y="11" class="small">Soft membrane</text>
      <rect x="432" width="22" height="13" fill="#eeefe7" stroke="#aab5a2" stroke-width=".7"/><text x="463" y="11" class="small">Honed ivory floor</text>
    </g>
    <text x="149" y="747" class="small">Dimensions in metres. Furniture follows the current 3D study. Room 001 is a separate patient habitat.</text>
  </g>
</svg>`;
}
