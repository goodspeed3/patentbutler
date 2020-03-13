import React, {useState, useEffect} from 'react';
import './process.css'
import { Document, Page, pdfjs} from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js'

function PdfView (props) {
    let { fileData, oaObject, setOaObject, showPriorArt, setShowPriorArt, panePosition, downloadedData, priorArtList } = props
    let { filename, user:email } = fileData

    const [scale, setScale] = useState(1.0)
    const [fitScale, setFitScale] = useState(1.0)
    const [isScaleLocked, setIsScaleLocked] = useState(false)
    const [numPages, setNumPages] = useState(null)
    const [originalPageWidth, setOriginalPageWidth] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [paToLoad, setPaToLoad] = useState(0)
    const [pdfToLoad, setPdfToLoad] = useState(null)


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
        if (showPriorArt && priorArtList.files && priorArtList.files.length > 0) {
            setPdfToLoad('/' + priorArtList.files[paToLoad].path)
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
                    priorArtList.files && priorArtList.files.length > 0 &&
                    <>
                        &nbsp; 
                        <select onChange={(e) => {setShowPriorArt(true); setPaToLoad(parseInt(e.target.value))}}>
                            {priorArtList.files.map((paFile, index) => <option key={paFile.filename} value={index}>{paFile.originalname}</option>)}
                        </select>
                    </>
                }
            </span>
          )
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
        <div className='pdfDiv' id="pdfDiv" >
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
          
        </div>
        
    </div>
    )
}

export default PdfView;
