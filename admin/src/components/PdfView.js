import React, {useState, useEffect} from 'react';
import './process.css'
import { Document, Page, pdfjs} from 'react-pdf'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'

pdfjs.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js'

function PdfView (props) {
    let { fileData, showPriorArt, setShowPriorArt, panePosition, downloadedData, priorArtList, setPriorArtList, rejectionList } = props

    const [scale, setScale] = useState(1.0)
    const [fitScale, setFitScale] = useState(1.0)
    const [isScaleLocked, setIsScaleLocked] = useState(false)
    const [numPages, setNumPages] = useState(null)
    const [originalPageWidth, setOriginalPageWidth] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [paToLoad, setPaToLoad] = useState(0)
    const [pdfToLoad, setPdfToLoad] = useState(null)
    const [dragRect, setDragRect] = useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0
    })
    const [showCitationDiv, setShowCitationDiv] = useState(false)
    const [citationObj, setCitationObj] = useState({})
    const [selectedCitation, setSelectedCitation] = useState('')

    useEffect(() => {
      setCitationObj(c => {
        if (fileData && fileData.finishedProcessingTime) { //prefill!
          var prefilledCitationObj = {}

          for (var a=0; a<fileData.priorArtList.length; a++) {
            let pa = fileData.priorArtList[a]
            prefilledCitationObj[pa.publicationNumber] = pa.citationList
          }
          return prefilledCitationObj
        }

        //copy citations over
        var newCitationList=[]
        for (var i=0; i<rejectionList.length; i++) {
          const rejection = rejectionList[i]
          if (!rejection.claimArgumentList) continue
          for (var j=0; j<rejection.claimArgumentList.length; j++) {
            const claimArgument = rejection.claimArgumentList[j]
            if (!claimArgument.citationList) continue
            for (var k=0; k<claimArgument.citationList.length; k++) {
              const citationObj = claimArgument.citationList[k]
    
              var newObj = {
                ...citationObj,
                overlayAdded: false,
                boundingBoxes: []
              }
              newCitationList.push(newObj)
            }
          }
        }
        if (newCitationList.length === 0) return c

        var newCitationObj = {}
        //clear citationObj 
        for (i=0; i<newCitationList.length; i++) {
          const co = newCitationList[i]
          if (!co.publicationNumber) continue
          newCitationObj[co.publicationNumber] = []
        }

        let keyObj = Object.keys(newCitationObj) 
        for (i=0; i<keyObj.length; i++) {
          const pubnum = keyObj[i]
          const citList = newCitationObj[pubnum]
          for (j=0; j<newCitationList.length; j++) {
            const co = newCitationList[j]
            if (co.publicationNumber === pubnum) {
              //only add to list if it doesn't already exist
              let tCit = co.citation
              if (!citList.some(o => o.citation === tCit )) {
                delete co.publicationNumber //don't need it anymore
                citList.push(co)
              }
            }
          }
        }
        console.log('newCitationObj')
        console.log(newCitationObj)

        return newCitationObj

      })
    }, [rejectionList, setCitationObj, fileData])
    useEffect(() => {
      setPriorArtList(pal => {
        let pubnums = Object.keys(citationObj) 
        if (pubnums.length === 0) return pal
        for (var i=0; i<pubnums.length; i++) {
          let pubnum = pubnums[i]
          let citationList = citationObj[pubnum]
          pal.forEach((pa) => {
            if (pa.publicationNumber === pubnum) {
              pa.citationList = citationList
            }
          })
        }  
        return pal
      })
    }, [citationObj, setPriorArtList])

    useEffect(() => {
        if (!isScaleLocked && originalPageWidth != null) {
            //this is needed for when user drags pane
            const parentDiv = document.querySelector('#PAView')
            let pageScale = parentDiv.clientWidth / originalPageWidth

            //only update scale if user did not zoom in or out
            setScale(pageScale)
            setFitScale(pageScale)
          }    
    }, [isScaleLocked, originalPageWidth, panePosition])

    useEffect(() => {
        if (showPriorArt && priorArtList.length > 0) {
            setPdfToLoad('/' + priorArtList[paToLoad].pdfUrl)
        } else {
            setPdfToLoad(downloadedData)
        }
      }, [showPriorArt, paToLoad, pdfToLoad,downloadedData, priorArtList])

    const removeTextLayerOffset = () => {
        const textLayers = document.querySelectorAll(".react-pdf__Page__textContent");
          textLayers.forEach(layer => {
            const { style } = layer;
            style.top = "0";
            style.left = "0";
            style.transform = "";
        });
      }
      const previousPage = () => changePage(-1);
      const nextPage = () => changePage(1);
      const changePage = offset => {
          setPageNumber(pageNumber + offset)
      };
    
      const zoomIn = () => changeZoom(0.25);
      const zoomOut = () => changeZoom(-0.25);
      const changeZoom = offset => {
        if (scale+offset > fitScale) {
            setIsScaleLocked(true)
        } else {
          setIsScaleLocked(false)
        }
        setScale(scale+offset)
      }

      const handlePageEntry = (event) => {
        let pageNo = parseInt(event.target.value)
        if ( isNaN(pageNo) || pageNo > numPages || pageNo <= 0) {
          
        } else {
            setPageNumber(pageNo)
        }
      }
      const onDocumentLoadSuccess = (document) => {
        const { numPages } = document;
        setNumPages(numPages)
      };
    
      const onPageLoad = (page) => {
        const parentDiv = document.querySelector('#PAView')
        let pageScale = parentDiv.clientWidth / page.originalWidth
        // console.log("pagescale: " + pageScale + " parentDiv width: " + parentDiv.clientWidth)
        if (originalPageWidth == null || (scale !== pageScale && !isScaleLocked)) {
            setScale(pageScale)
            setFitScale(pageScale)
            setOriginalPageWidth(page.originalWidth)
        }
      }
      const onRenderSuccessHandler = () => {
        removeTextLayerOffset()
      }

      const toggleElements = () => {
          return (
            <span>
                <button type="button" disabled={!showPriorArt} onClick={() => setShowPriorArt(false)}>Office Action</button>
                <button type="button" disabled={showPriorArt} onClick={() => setShowPriorArt(true)}>Prior Art</button>
                {
                    priorArtList.length > 0 &&
                    <>
                        &nbsp; 
                        <select onChange={(e) => {setShowPriorArt(true); setPaToLoad(parseInt(e.target.value))}}>
                            {priorArtList.map((paFile, index) => <option key={paFile.filename} value={index}>{paFile.originalname}</option>)}
                        </select>
                    </>
                }
            </span>
          )
      }
      const mouseDown = (e) => {
        if (!showPriorArt ) return;
        setShowCitationDiv(false)
        var rect = e.target.getBoundingClientRect();
        var x = e.clientX - rect.left; //x position within the element.
        var y = e.clientY - rect.top;  //y position within the element.
        setDragRect({
          ...dragRect,
          x: (100.0* x / rect.width).toFixed(2), //get percentage
          y: (100.0* y / rect.height).toFixed(2),
        })
      }
      const mouseUp = (e) => {
        if (!showPriorArt ) return;
        var rect = e.target.getBoundingClientRect();
        var x = e.clientX - rect.left; //x position within the element.
        var y = e.clientY - rect.top;  //y position within the element.
        // console.log({x: 100.0* x / rect.width, y: 100.0* y / rect.height})
        let width = ((100.0* x / rect.width).toFixed(2) - dragRect.x).toFixed(2) //get percentage
        let height = ((100.0* y / rect.height).toFixed(2) - dragRect.y).toFixed(2)
        setDragRect({
          ...dragRect,
          width:  width,
          height: height
        })
        if (width > 1 && height > 1) {
          setShowCitationDiv(true)
        }

      }      
      const selectCitation = (e) => {
        setSelectedCitation(e.target.value)
      }
      const saveCitation = (e) => {
        if (!selectedCitation) return
        var cList = citationObj[priorArtList[paToLoad].publicationNumber]
        for (var i=0; i<cList.length; i++) {
          var cObj = cList[i]  
          if (cObj.citation === selectedCitation) {
            var bbox = {}
            bbox.page = pageNumber
            bbox.boundingBox = dragRect
            cObj.overlayAdded = true
            cObj.boundingBoxes.push(bbox)
          }
        }
        setCitationObj({...citationObj})
        setShowCitationDiv(false)
      }
      const showCitationDivElements = () => {
        if (!showCitationDiv || priorArtList.length === 0 || !citationObj[priorArtList[paToLoad].publicationNumber]) {
          return
        }
        const pdfDiv = document.querySelector('#pdfDiv')
    
        if (!pdfDiv) {
          return
        }

        var styleObj = {
          left: dragRect.x + '%',
          top: dragRect.y + '%',
          width: dragRect.width + '%',
          height: dragRect.height + '%',
          backgroundColor: 'rgb(255,66,65,0.15)',
        }
        var dimensions = {}
        dimensions.zIndex = "99" //this should be on top
        if (!isScaleLocked) {
          dimensions.width = pdfDiv.clientWidth
          dimensions.height = pdfDiv.clientHeight
        } else {
          dimensions.width = pdfDiv.scrollWidth
          dimensions.height = pdfDiv.scrollHeight
    
        }
        return <div className='overlay' style={dimensions}><div style={styleObj} className='citationDiv' onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()}>
          <Form style={{padding: "1rem"}}>
          <Form.Group>
            <Form.Control size='sm' as="select" value={selectedCitation} onChange={selectCitation}>
              <option value=''>--</option>
              {
                citationObj[priorArtList[paToLoad].publicationNumber].map(c => 
                <option value={c.citation} key={c.id}>{c.citation} {c.overlayAdded && '(done)'}</option>
                )
              }
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Button variant="secondary" size="sm" onClick={saveCitation}>Save</Button>
          </Form.Group>

          </Form>
        </div></div>
      }
      const removeOverlay = (id, coordinateString) => {
        var citationList = citationObj[priorArtList[paToLoad].publicationNumber]
        for (var i=0; i<citationList.length; i++) {
          var citObj = citationList[i]
          for (var j=0 ;j<citObj.boundingBoxes.length ;j++) {
            var cobb = citObj.boundingBoxes[j]
            var objCoord = cobb.boundingBox.y + '%-' + cobb.boundingBox.x + '%-' + cobb.boundingBox.width + '%-' + cobb.boundingBox.height + '%'
            if (citObj.id === id && objCoord === coordinateString) {
              citObj.boundingBoxes.splice(j, 1)
              if (citObj.boundingBoxes.length === 0)
                citObj.overlayAdded = false
            }  
          }
        }
        setCitationObj({...citationObj})
      }
      const generateOverlay = () => {
        if (!showPriorArt || priorArtList.length === 0 || !citationObj[priorArtList[paToLoad].publicationNumber]) return
        const pdfDiv = document.querySelector('#pdfDiv')
        var styleArray = []
        var citationList = citationObj[priorArtList[paToLoad].publicationNumber]
        for (var i=0; i<citationList.length; i++) {
          let citationBox = citationList[i]
          for (var j=0; j<citationBox.boundingBoxes.length; j++) {
            let citationBoxIndividual = citationBox.boundingBoxes[j]
            if (citationBoxIndividual.page !== pageNumber) {
              continue;
            }
            var styleObj = {}
            styleObj.id=citationBox.id
            styleObj.idName=""
            styleObj.position = "absolute"
            styleObj.top = citationBoxIndividual.boundingBox.y + "%"
            styleObj.left = citationBoxIndividual.boundingBox.x + "%"
            styleObj.width = citationBoxIndividual.boundingBox.width + "%"
            styleObj.height = citationBoxIndividual.boundingBox.height + "%"
            styleObj.backgroundColor = "rgb(255,225,143, 0.15)"
            // styleObj.zIndex= "10"
            styleArray.push(styleObj)
  
          }
        }
        var dimensions = {}
        dimensions.zIndex="10"
        if (!isScaleLocked) {
          dimensions.width = pdfDiv.clientWidth
          dimensions.height = pdfDiv.clientHeight
        } else {
          dimensions.width = pdfDiv.scrollWidth
          dimensions.height = pdfDiv.scrollHeight
    
        }
    
        return <div className='overlay' style={dimensions}>
          {
            styleArray.map((styleObj, i) =>  (
              <div id={styleObj.idName} style={styleObj} key={i + styleObj.top + '-' + styleObj.left + '-' + styleObj.width + '-' + styleObj.height}>
                <button style={{margin: '1rem'}} onClick={(e) => removeOverlay(styleObj.id, styleObj.top + '-' + styleObj.left + '-' + styleObj.width + '-' + styleObj.height)}>Remove</button>
              </div>
            ))
          }
        </div>
      }

    return (
        <div id="PAView" className="PAView">
        <div className='subviewHeader' id="subviewHeader">
        <div className="pageMetadata">{toggleElements()}</div>
          <div>
            <input type="text" size={5} placeholder='Page #' onChange={handlePageEntry}/>
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={previousPage}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pageNumber >= numPages}
              onClick={nextPage}
            >
              Next
            </button>
            <button
              type="button"
              disabled={scale >= 3}
              onClick={zoomIn}
            >
              Bigger
            </button>
            <button
              type="button"
              disabled={scale <= 0.5}
              onClick={zoomOut}
            >
              Smaller
            </button>     | Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}   
          </div>      
        </div> 
        <div style={showPriorArt ? {cursor: 'crosshair'}: {cursor: 'default'}} className='pdfDiv' id="pdfDiv" onMouseDown={mouseDown} onMouseUp={mouseUp}>
          <Document
            file={pdfToLoad}
            cMapUrl={process.env.PUBLIC_URL + '/cmaps/'}
            cMapPacked={true}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page 
              pageNumber={pageNumber} 
              onLoadSuccess={onPageLoad}
              scale={scale}
              onRenderSuccess={onRenderSuccessHandler}

              // customTextRenderer={this.makeTextRenderer("0030")}
            />
          </Document>    
          {generateOverlay()}      
          {showCitationDivElements()}    
        </div>
    </div>
    )
}

export default PdfView;
