import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const zip = new JSZip();

// [Content_Types].xml
zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
</Types>`);

// _rels/.rels
zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

// word/_rels/document.xml.rels
zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/chart1.xml"/>
</Relationships>`);

// word/document.xml — a paragraph with {myChart} tag
zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:r>
        <w:t>{reportTitle}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{companyName} - {generatedDate}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="5486400" cy="3200400"/>
            <wp:docPr id="1" name="Chart 1"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
                <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
                         xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                         r:id="rId1">
                  <c:title>
                    <c:tx>
                      <c:rich>
                        <a:bodyPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>
                        <a:lstStyle xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>
                        <a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                          <a:r>
                            <a:rPr lang="zh-CN" dirty="0"/>
                            <a:t>{myChart}</a:t>
                          </a:r>
                        </a:p>
                      </c:rich>
                    </c:tx>
                    <c:overlay val="0"/>
                  </c:title>
                </c:chart>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
  </w:body>
</w:document>`);

// word/charts/chart1.xml — a minimal chart structure
zip.file('word/charts/chart1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:chart>
    <c:plotArea>
      <c:layout/>
      <c:barChart>
        <c:barDir val="col"/>
        <c:ser>
          <c:idx val="0"/>
          <c:order val="0"/>
          <c:tx><c:v>Series 1</c:v></c:tx>
          <c:cat><c:strRef><c:strCache><c:ptCount val="0"/></c:strCache></c:strRef></c:cat>
          <c:val><c:numRef><c:numCache><c:ptCount val="0"/></c:numCache></c:strRef></c:val>
        </c:ser>
        <c:axId val="100"/>
        <c:axId val="200"/>
      </c:barChart>
      <c:catAx>
        <c:axId val="100"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:axPos val="b"/>
        <c:crossAx val="200"/>
      </c:catAx>
      <c:valAx>
        <c:axId val="200"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:axPos val="l"/>
        <c:crossAx val="100"/>
      </c:valAx>
    </c:plotArea>
    <c:legend>
      <c:legendPos val="b"/>
    </c:legend>
  </c:chart>
  <c:externalData r:id="rId1">
    <c:autoUpdate val="0"/>
  </c:externalData>
</c:chartSpace>`);

zip.generateAsync({ type: 'nodebuffer' }).then((buffer) => {
  const outPath = path.join(__dirname, '..', 'test-templates', 'chart-template.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Template created:', outPath);
});
